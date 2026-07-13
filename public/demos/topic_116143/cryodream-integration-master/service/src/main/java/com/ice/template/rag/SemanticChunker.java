package com.ice.template.rag;

import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import com.ice.template.model.entity.KnowledgeChunk;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SemanticChunker {

    private static final int DEFAULT_CHUNK_SIZE = 500;
    private static final int DEFAULT_OVERLAP_SIZE = 50;

    public List<ChunkInfo> chunk(String text, JSONObject globalMetadata) {
        return chunk(text, globalMetadata, DEFAULT_CHUNK_SIZE, DEFAULT_OVERLAP_SIZE);
    }

    public List<ChunkInfo> chunk(String text, JSONObject globalMetadata, int chunkSize, int overlapSize) {
        List<ChunkInfo> chunks = new ArrayList<>();
        
        if (StringUtils.isBlank(text)) {
            return chunks;
        }

        String cleanedText = cleanText(text);
        List<String> paragraphs = splitIntoParagraphs(cleanedText);
        
        StringBuilder currentChunk = new StringBuilder();
        int chunkIndex = 0;

        for (int i = 0; i < paragraphs.size(); i++) {
            String paragraph = paragraphs.get(i);
            
            if (currentChunk.length() + paragraph.length() <= chunkSize) {
                if (currentChunk.length() > 0) {
                    currentChunk.append("\n\n");
                }
                currentChunk.append(paragraph);
            } else {
                if (currentChunk.length() > 0) {
                    chunks.add(createChunk(currentChunk.toString(), chunkIndex++, globalMetadata));
                }
                
                String remaining = paragraph;
                while (remaining.length() > chunkSize) {
                    String subChunk = remaining.substring(0, chunkSize);
                    int lastPeriod = subChunk.lastIndexOf('。');
                    int lastNewline = subChunk.lastIndexOf('\n');
                    int splitIndex = Math.max(lastPeriod + 1, lastNewline + 1);
                    if (splitIndex == 0) {
                        splitIndex = chunkSize;
                    }
                    chunks.add(createChunk(subChunk.substring(0, splitIndex), chunkIndex++, globalMetadata));
                    remaining = remaining.substring(splitIndex);
                }
                currentChunk = new StringBuilder(remaining);
            }
        }

        if (currentChunk.length() > 0) {
            chunks.add(createChunk(currentChunk.toString(), chunkIndex, globalMetadata));
        }

        if (!chunks.isEmpty() && overlapSize > 0) {
            addOverlap(chunks, overlapSize);
        }

        return chunks;
    }

    private String cleanText(String text) {
        return text
                .replaceAll("\\r\\n", "\n")
                .replaceAll("\\n{3,}", "\n\n")
                .replaceAll("\\s{2,}", " ")
                .trim();
    }

    private List<String> splitIntoParagraphs(String text) {
        List<String> paragraphs = new ArrayList<>();
        String[] parts = text.split("\n\n");
        for (String part : parts) {
            String trimmed = part.trim();
            if (trimmed.length() > 0) {
                paragraphs.add(trimmed);
            }
        }
        return paragraphs;
    }

    private ChunkInfo createChunk(String text, int index, JSONObject globalMetadata) {
        ChunkInfo chunk = new ChunkInfo();
        chunk.setChunkIndex(index);
        chunk.setChunkText(text);
        chunk.setRawText(text);
        chunk.setMetadata(globalMetadata != null ? globalMetadata.toString() : "{}");
        return chunk;
    }

    private void addOverlap(List<ChunkInfo> chunks, int overlapSize) {
        for (int i = 1; i < chunks.size(); i++) {
            ChunkInfo prevChunk = chunks.get(i - 1);
            ChunkInfo currChunk = chunks.get(i);
            
            String prevText = prevChunk.getChunkText();
            if (prevText.length() > overlapSize) {
                String overlap = prevText.substring(prevText.length() - overlapSize);
                currChunk.setChunkText(overlap + "\n\n" + currChunk.getChunkText());
            }
        }
    }

    /**
     * 带元数据附加的语义分块，返回 KnowledgeChunk 列表
     */
    public List<KnowledgeChunk> chunkWithMetadata(String content, JSONObject globalMetadata) {
        List<ChunkInfo> chunkInfos = chunk(content, globalMetadata);
        List<KnowledgeChunk> chunks = new ArrayList<>();
        for (ChunkInfo chunkInfo : chunkInfos) {
            KnowledgeChunk chunk = new KnowledgeChunk();
            chunk.setChunkIndex(chunkInfo.getChunkIndex());
            chunk.setChunkText(chunkInfo.getChunkText());
            chunk.setRawText(chunkInfo.getRawText());
            chunk.setMetadata(chunkInfo.getMetadata());
            chunks.add(chunk);
        }
        return chunks;
    }

    public static class ChunkInfo {
        private int chunkIndex;
        private String chunkText;
        private String rawText;
        private String metadata;

        public int getChunkIndex() {
            return chunkIndex;
        }

        public void setChunkIndex(int chunkIndex) {
            this.chunkIndex = chunkIndex;
        }

        public String getChunkText() {
            return chunkText;
        }

        public void setChunkText(String chunkText) {
            this.chunkText = chunkText;
        }

        public String getRawText() {
            return rawText;
        }

        public void setRawText(String rawText) {
            this.rawText = rawText;
        }

        public String getMetadata() {
            return metadata;
        }

        public void setMetadata(String metadata) {
            this.metadata = metadata;
        }
    }
}
