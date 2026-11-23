import { useRef, useCallback, memo } from 'react';
import { List, type ListImperativeAPI } from 'react-window';
import VoiceoverBlock from './VoiceoverBlock';

interface VirtualizedBlockListProps {
  blocks: any[];
  selectedBlocks: number[];
  highlightedBlock: number | null;
  currentPlayingBlockId: number | null;
  onBlockClick: (id: number) => void;
  onCheckboxChange: (id: number) => void;
  onContentChange: (blockId: number, newContent: string) => void;
  onPlayBlock: (blockId: number) => void;
  onVoiceClick: (blockId: number) => void;
  containerHeight: number;
}

const BLOCK_HEIGHT = 200;

interface RowComponentProps {
  index: number;
  style: React.CSSProperties;
  blocks: any[];
  selectedBlocks: number[];
  highlightedBlock: number | null;
  currentPlayingBlockId: number | null;
  onBlockClick: (id: number) => void;
  onCheckboxChange: (id: number) => void;
  onContentChange: (blockId: number, newContent: string) => void;
  onPlayBlock: (blockId: number) => void;
  onVoiceClick: (blockId: number) => void;
}

const RowComponent = memo((({
  index,
  style,
  blocks,
  selectedBlocks,
  highlightedBlock,
  currentPlayingBlockId,
  onBlockClick,
  onCheckboxChange,
  onContentChange,
  onPlayBlock,
  onVoiceClick,
}: RowComponentProps) => {
  const block = blocks[index];
  if (!block) return null;

  return (
    <div style={style}>
      <VoiceoverBlock
        block={block}
        index={index}
        isSelected={selectedBlocks.includes(block.id)}
        isHighlighted={highlightedBlock === block.id}
        onBlockClick={onBlockClick}
        onCheckboxChange={onCheckboxChange}
        onContentChange={onContentChange}
        onPlayBlock={onPlayBlock}
        currentPlayingBlockId={currentPlayingBlockId}
        onVoiceClick={onVoiceClick}
      />
    </div>
  );
}) as React.FC<RowComponentProps>);

RowComponent.displayName = 'RowComponent';

function VirtualizedBlockList({
  blocks,
  selectedBlocks,
  highlightedBlock,
  currentPlayingBlockId,
  onBlockClick,
  onCheckboxChange,
  onContentChange,
  onPlayBlock,
  onVoiceClick,
  containerHeight,
}: VirtualizedBlockListProps) {
  const listRef = useRef<ListImperativeAPI>(null);

  if (!blocks || blocks.length === 0) {
    return (
      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <p className="text-center text-gray-500">Đang tải blocks...</p>
      </div>
    );
  }

  const scrollToBlock = useCallback((blockId: number) => {
    const index = blocks.findIndex((b) => b.id === blockId);
    if (index !== -1 && listRef.current) {
      listRef.current.scrollToRow({ index, align: 'center' });
    }
  }, [blocks]);

  (VirtualizedBlockList as any).scrollToBlock = scrollToBlock;

  return (
    <div className="max-w-[1400px] mx-auto px-6 pb-32">
      <List
        listRef={listRef}
        rowCount={blocks.length}
        rowHeight={() => BLOCK_HEIGHT}
        defaultHeight={containerHeight}
        overscanCount={5}
        rowComponent={RowComponent}
        rowProps={{
          blocks,
          selectedBlocks,
          highlightedBlock,
          currentPlayingBlockId,
          onBlockClick,
          onCheckboxChange,
          onContentChange,
          onPlayBlock,
          onVoiceClick,
        }}
      />
    </div>
  );
}

export default memo(VirtualizedBlockList);
