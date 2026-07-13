import { BaseRepository } from './BaseRepository';
import { generateId } from '../../../shared/utils/id';
import { createHash } from 'crypto';

export interface Version {
  id: string;
  collection_id: string;
  version_number: number;
  title?: string;
  content?: string;
  content_text?: string;
  html_content?: string;
  word_count?: number;
  checksum?: string;
  change_summary?: string;
  created_at: string;
}

export class VersionRepository extends BaseRepository<Version> {
  constructor() {
    super('versions', undefined, false);
  }

  getByCollectionId(collectionId: string, page: number = 1, pageSize: number = 20): { items: Version[]; total: number } {
    const offset = (page - 1) * pageSize;
    
    const countStmt = this.db.prepare<[string], { count: number }>(
      'SELECT COUNT(*) as count FROM versions WHERE collection_id = ?'
    );
    const countResult = countStmt.get(collectionId);
    const total = countResult?.count || 0;

    const sql = `
      SELECT * FROM versions 
      WHERE collection_id = ? 
      ORDER BY version_number DESC 
      LIMIT ? OFFSET ?
    `;
    const stmt = this.db.prepare<[string, number, number], Version>(sql);
    const items = stmt.all(collectionId, pageSize, offset);

    return { items, total };
  }

  getAllByCollectionId(collectionId: string): Version[] {
    const sql = `
      SELECT * FROM versions 
      WHERE collection_id = ? 
      ORDER BY version_number DESC
    `;
    const stmt = this.db.prepare<[string], Version>(sql);
    return stmt.all(collectionId);
  }

  getLatestVersion(collectionId: string): Version | null {
    const sql = `
      SELECT * FROM versions 
      WHERE collection_id = ? 
      ORDER BY version_number DESC 
      LIMIT 1
    `;
    return this.queryOne<string, Version>(sql, [collectionId]);
  }

  getByVersionNumber(collectionId: string, versionNumber: number): Version | null {
    return this.findOneWhere([
      { field: 'collection_id', value: collectionId },
      { field: 'version_number', value: versionNumber },
    ]);
  }

  getById(id: string): Version | null {
    return this.findOneWhere([{ field: 'id', value: id }]);
  }

  getNextVersionNumber(collectionId: string): number {
    const latest = this.getLatestVersion(collectionId);
    return latest ? latest.version_number + 1 : 1;
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
  ): Version {
    const versionNumber = this.getNextVersionNumber(collectionId);
    const contentForChecksum = data.content_text || data.content || '';
    const checksum = createHash('sha256').update(contentForChecksum).digest('hex');

    const now = new Date().toISOString();
    return this.create({
      id: generateId(),
      collection_id: collectionId,
      version_number: versionNumber,
      title: data.title,
      content: data.content,
      content_text: data.content_text,
      html_content: data.html_content,
      word_count: data.word_count,
      checksum,
      change_summary: data.change_summary,
      created_at: now,
    });
  }

  createInitialVersion(
    collectionId: string,
    data: {
      title?: string;
      content?: string;
      content_text?: string;
      html_content?: string;
      word_count?: number;
    }
  ): Version {
    return this.createVersion(collectionId, {
      ...data,
      change_summary: 'Initial version',
    });
  }

  deleteByCollectionId(collectionId: string): number {
    const stmt = this.db.prepare('DELETE FROM versions WHERE collection_id = ?');
    const result = stmt.run(collectionId);
    return result.changes;
  }

  countByCollectionId(collectionId: string): number {
    return this.count([{ field: 'collection_id', value: collectionId }]);
  }

  listVersions(collectionId: string, limit?: number): Version[] {
    const sql = limit
      ? `SELECT * FROM versions WHERE collection_id = ? ORDER BY version_number DESC LIMIT ?`
      : `SELECT * FROM versions WHERE collection_id = ? ORDER BY version_number DESC`;

    const stmt = this.db.prepare<[string, number?], Version>(sql);
    return stmt.all(collectionId, ...(limit ? [limit] : []));
  }
}

export const versionRepository = new VersionRepository();
