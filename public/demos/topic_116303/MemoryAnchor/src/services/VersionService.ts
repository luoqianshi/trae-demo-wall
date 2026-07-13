import * as Diff from 'diff';
import { versionRepository, Version } from '../database/sqlite/repositories/VersionRepository';
import { collectionRepository } from '../database/sqlite/repositories/CollectionRepository';
import { collectionService } from './CollectionService';
import { VersionData, VersionListData, VersionCompareData, VersionUpdateCheckData, CollectionData } from '../shared/types/ipc';

export interface DiffChange {
  count: number;
  added?: boolean;
  removed?: boolean;
  value: string;
}

export interface DiffStats {
  additions: number;
  deletions: number;
  modifications: number;
}

export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
}

export class VersionService {
  getVersions(collectionId: string, page: number = 1, pageSize: number = 20): VersionListData {
    const result = versionRepository.getByCollectionId(collectionId, page, pageSize);
    
    return {
      items: result.items.map(v => this.toVersionData(v)),
      total: result.total,
      page,
      pageSize,
    };
  }

  getVersion(versionId: string): VersionData | null {
    const version = versionRepository.getById(versionId);
    return version ? this.toVersionData(version) : null;
  }

  getLatestVersion(collectionId: string): VersionData | null {
    const version = versionRepository.getLatestVersion(collectionId);
    return version ? this.toVersionData(version) : null;
  }

  compareVersions(collectionId: string, versionAId: string, versionBId: string): VersionCompareData | null {
    const versionA = versionRepository.getById(versionAId);
    const versionB = versionRepository.getById(versionBId);

    if (!versionA || !versionB) {
      return null;
    }

    if (versionA.collection_id !== collectionId || versionB.collection_id !== collectionId) {
      return null;
    }

    const textA = versionA.content_text || versionA.content || '';
    const textB = versionB.content_text || versionB.content || '';

    const changes = Diff.diffLines(textA, textB);
    const stats = this.calculateDiffStats(changes);
    const diffLines = this.changesToLines(changes);

    return {
      versionA: this.toVersionData(versionA),
      versionB: this.toVersionData(versionB),
      diff: JSON.stringify(diffLines),
      changes: stats,
    };
  }

  async restoreVersion(collectionId: string, versionId: string): Promise<CollectionData | null> {
    const version = versionRepository.getById(versionId);
    if (!version || version.collection_id !== collectionId) {
      return null;
    }

    const collection = collectionService.getCollection(collectionId);
    if (!collection) {
      return null;
    }

    const currentCollection = collectionRepository.getById(collectionId);

    if (currentCollection) {
      versionRepository.createVersion(
        collectionId,
        {
          title: currentCollection.title,
          content: currentCollection.content,
          content_text: currentCollection.content_text,
          html_content: currentCollection.html_content,
          word_count: currentCollection.word_count,
          change_summary: 'Auto-saved before version restore',
        }
      );
    }

    collectionRepository.update(collectionId, {
      title: version.title || collection.title,
      content: version.content,
      content_text: version.content_text,
      html_content: version.html_content,
      word_count: version.word_count,
      updated_at: new Date().toISOString(),
    });

    collectionRepository.incrementVersionCount(collectionId);

    return collectionService.getCollection(collectionId);
  }

  async checkForUpdate(collectionId: string): Promise<VersionUpdateCheckData> {
    const collection = collectionService.getCollection(collectionId);
    if (!collection) {
      return {
        hasUpdate: false,
        currentVersion: 'unknown',
      };
    }

    const latestVersion = versionRepository.getLatestVersion(collectionId);
    const currentVersionNum = latestVersion?.version_number || 1;

    return {
      hasUpdate: false,
      currentVersion: `v${currentVersionNum}`,
      changeDescription: 'Manual re-scrape to check for updates',
    };
  }

  createVersion(
    collectionId: string,
    data: {
      title?: string;
      content?: string;
      content_text?: string;
      html_content?: string;
      word_count?: number;
      change_summary?: string;
    }
  ): VersionData {
    const version = versionRepository.createVersion(collectionId, data);
    return this.toVersionData(version);
  }

  private calculateDiffStats(changes: Diff.Change[]): DiffStats {
    let additions = 0;
    let deletions = 0;

    for (const change of changes) {
      const lines = change.value.split('\n').filter((l, i, arr) => l.length > 0 || (i === arr.length - 1 && false)).length;
      if (change.added) {
        additions += lines;
      } else if (change.removed) {
        deletions += lines;
      }
    }

    const modifications = Math.min(additions, deletions);
    additions -= modifications;
    deletions -= modifications;

    return { additions, deletions, modifications };
  }

  private changesToLines(changes: Diff.Change[]): DiffLine[] {
    const lines: DiffLine[] = [];

    for (const change of changes) {
      const type: 'added' | 'removed' | 'unchanged' = change.added 
        ? 'added' 
        : change.removed 
          ? 'removed' 
          : 'unchanged';
      
      const textLines = change.value.split('\n');
      for (let i = 0; i < textLines.length; i++) {
        const line = textLines[i];
        if (i === textLines.length - 1 && line.length === 0) continue;
        lines.push({ type, content: line });
      }
    }

    return lines;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private toVersionData(version: Version): VersionData {
    return {
      id: version.id,
      collectionId: version.collection_id,
      versionNumber: version.version_number,
      title: version.title,
      content: version.content_text || version.content || '',
      htmlContent: version.html_content,
      checksum: version.checksum || '',
      wordCount: version.word_count,
      createdAt: version.created_at,
      changeDescription: version.change_summary,
    };
  }
}

export const versionService = new VersionService();
