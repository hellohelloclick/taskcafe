import React, { useRef, useEffect } from 'react';
import { Dot, CaretDown, CaretRight } from 'shared/icons';

import { EntryChildren, EntryWrapper, EntryContent, EntryInnerContent, EntryHandle, ExpandButton } from './Styles';
import { useDrag } from './useDrag';
import { getCaretPosition, setCurrentCursorPosition } from './utils';

type EntryProps = {
  id: string;
  collapsed?: boolean;
  onToggleCollapse: (id: string, collapsed: boolean) => void;
  parentID: string;
  onStartDrag: (e: { id: string; clientX: number; clientY: number }) => void;
  onStartSelect: (e: { id: string; depth: number }) => void;
  isRoot?: boolean;
  selection: null | Array<{ id: string }>;
  draggedNodes: null | Array<string>;
  onNodeFocused: (id: string) => void;
  text: string;
  entries: Array<ItemElement>;
  onCancelDrag: () => void;
  autoFocus: null | { caret: null | number };
  onCreateEntry: (parent: string, nextPositon: number) => void;
  position: number;
  chain?: Array<string>;
  onDeleteEntry: (depth: number, id: string, text: string, caretPos: number) => void;
  depth?: number;
};

const Entry: React.FC<EntryProps> = ({
  id,
  text,
  parentID,
  isRoot = false,
  selection,
  onToggleCollapse,
  autoFocus,
  onStartSelect,
  position,
  onNodeFocused,
  onCreateEntry,
  onDeleteEntry,
  onCancelDrag,
  onStartDrag,
  collapsed = false,
  draggedNodes,
  entries,
  chain = [],
  depth = 0,
}) => {
  const $entry = useRef<HTMLDivElement>(null);
  const $children = useRef<HTMLDivElement>(null);
  const { setNodeDimensions, clearNodeDimensions } = useDrag();
  useEffect(() => {
    if (isRoot) return;
    if ($entry && $entry.current) {
      if (autoFocus) {
        if (autoFocus.caret) {
          setCurrentCursorPosition($entry.current, autoFocus.caret);
        } else {
          $entry.current.focus();
        }
        onNodeFocused(id);
      }
      setNodeDimensions(id, {
        entry: $entry,
        children: entries.length !== 0 ? $children : null,
      });
    }
    return () => {
      clearNodeDimensions(id);
    };
  }, [position, depth, entries]);
  let showHandle = true;
  if (draggedNodes && draggedNodes.length === 1 && draggedNodes.find(c => c === id)) {
    showHandle = false;
  }
  let isSelected = false;
  if (selection && selection.find(c => c.id === id)) {
    isSelected = true;
  }
  let onSaveTimer: any = null;
  const onSaveTimeout = 300;
  return (
    <EntryWrapper isSelected={isSelected} isDragging={!showHandle}>
      {!isRoot && (
        <EntryContent>
          {entries.length !== 0 && (
            <ExpandButton onClick={() => onToggleCollapse(id, !collapsed)}>
              {collapsed ? <CaretRight width={20} height={20} /> : <CaretDown width={20} height={20} />}
            </ExpandButton>
          )}
          {showHandle && (
            <EntryHandle
              onMouseUp={() => onCancelDrag()}
              onMouseDown={e => {
                onStartDrag({ id, clientX: e.clientX, clientY: e.clientY });
              }}
            >
              <Dot width={18} height={18} />
            </EntryHandle>
          )}
          <EntryInnerContent
            onMouseDown={() => {
              onStartSelect({ id, depth });
            }}
            onKeyDown={e => {
              if (e.keyCode === 13) {
                e.preventDefault();
                onCreateEntry(parentID, position * 2);
              } else if (e.keyCode === 8) {
                const caretPos = getCaretPosition($entry);
                if (caretPos === 0 && $entry.current) {
                  onDeleteEntry(depth, id, $entry.current.innerText, caretPos);
                  e.preventDefault();
                }
              } else if (e.key === 'z' && e.ctrlKey) {
                if ($entry && $entry.current) {
                  console.log(getCaretPosition($entry.current));
                }
              } else {
                clearTimeout(onSaveTimer);
                if ($entry && $entry.current) {
                  onSaveTimer = setTimeout(() => {
                    if ($entry && $entry.current) {
                      console.log($entry.current.textContent);
                    }
                  }, onSaveTimeout);
                }
              }
            }}
            contentEditable
            ref={$entry}
          >
            {text}
          </EntryInnerContent>
        </EntryContent>
      )}
      {entries.length !== 0 && !collapsed && (
        <EntryChildren ref={$children} isRoot={isRoot}>
          {entries
            .sort((a, b) => a.position - b.position)
            .map(entry => (
              <Entry
                onDeleteEntry={onDeleteEntry}
                parentID={id}
                key={entry.id}
                position={entry.position}
                text={entry.text}
                depth={depth + 1}
                draggedNodes={draggedNodes}
                collapsed={entry.collapsed}
                id={entry.id}
                autoFocus={entry.focus}
                onNodeFocused={onNodeFocused}
                onStartSelect={onStartSelect}
                onStartDrag={onStartDrag}
                onCancelDrag={onCancelDrag}
                entries={entry.children ?? []}
                chain={[...chain, id]}
                selection={selection}
                onToggleCollapse={onToggleCollapse}
                onCreateEntry={onCreateEntry}
              />
            ))}
        </EntryChildren>
      )}
    </EntryWrapper>
  );
};

export default Entry;
