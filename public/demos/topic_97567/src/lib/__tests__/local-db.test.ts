import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import {
  resetData,
  getUser,
  updateUser,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  addScoreEvent,
  getScoreEvents,
} from '../local-db';

vi.mock('fs', () => {
  const fns = {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    readFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    renameSync: vi.fn(),
    copyFileSync: vi.fn(),
  };
  return { ...fns, default: fns };
});

describe('Local DB', () => {
  const testUserId = '1';

  beforeEach(() => {
    vi.resetAllMocks();
    // Reset the in-memory cache by forcing reload
    resetData();
    // Mock the data file as non-existent to ensure we start fresh
    (fs.existsSync as any).mockReturnValue(false);
  });

  afterEach(() => {
    resetData();
  });

  describe('User operations', () => {
    it('should get the default user', () => {
      const user = getUser(testUserId);
      expect(user).toBeDefined();
      expect(user?.id).toBe(testUserId);
      expect(user?.email).toBe('user@snowball.diary');
    });

    it('should return null for non-existent user', () => {
      const user = getUser('non-existent');
      expect(user).toBeNull();
    });

    it('should update user successfully', () => {
      const updatedUser = updateUser(testUserId, { name: 'Updated Name' });
      expect(updatedUser.name).toBe('Updated Name');
      expect(updatedUser.updated_at).toBeDefined();
    });

    it('should throw error when updating non-existent user', () => {
      expect(() => updateUser('non-existent', { name: 'Test' })).toThrow('User not found');
    });
  });

  describe('Task operations', () => {
    it('should get empty tasks for new user', () => {
      const tasks = getTasks(testUserId);
      expect(tasks).toEqual([]);
    });

    it('should create a task successfully', () => {
      const taskData = { user_id: testUserId, title: 'Test Task', importance: 3 };
      const newTask = createTask(taskData);
      expect(newTask.id).toBeDefined();
      expect(newTask.title).toBe('Test Task');
      expect(newTask.created_at).toBeDefined();
    });

    it('should update a task successfully', () => {
      const task = createTask({ user_id: testUserId, title: 'Test Task', importance: 3 });
      const updatedTask = updateTask(task.id, { title: 'Updated Task' });
      expect(updatedTask.title).toBe('Updated Task');
    });

    it('should throw error when updating non-existent task', () => {
      expect(() => updateTask('non-existent', { title: 'Test' })).toThrow('Task not found');
    });

    it('should delete a task successfully', () => {
      const task = createTask({ user_id: testUserId, title: 'Test Task', importance: 3 });
      const result = deleteTask(task.id);
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent task', () => {
      expect(() => deleteTask('non-existent')).toThrow('Task not found');
    });

    it('should calculate quadrant when task has due date and importance', () => {
      const futureDate = new Date(Date.now() + 86400000).toISOString();
      const task = createTask({ 
        user_id: testUserId, 
        title: 'Test Task', 
        importance: 3,
        due_date: futureDate 
      });
      expect(task.quadrant).toBeDefined();
      expect(task.urgency).toBeDefined();
    });
  });

  describe('Record operations', () => {
    it('should get empty records for new user', () => {
      const records = getRecords(testUserId);
      expect(records).toEqual([]);
    });

    it('should create a record successfully', () => {
      const recordData = { user_id: testUserId, content: 'Test record' };
      const newRecord = createRecord(recordData);
      expect(newRecord.id).toBeDefined();
      expect(newRecord.content).toBe('Test record');
      expect(newRecord.created_at).toBeDefined();
    });

    it('should update a record successfully', () => {
      const record = createRecord({ user_id: testUserId, content: 'Test record' });
      const updatedRecord = updateRecord(record.id, { content: 'Updated record' });
      expect(updatedRecord.content).toBe('Updated record');
    });

    it('should throw error when updating non-existent record', () => {
      expect(() => updateRecord('non-existent', { content: 'Test' })).toThrow('Record not found');
    });

    it('should delete a record successfully', () => {
      const record = createRecord({ user_id: testUserId, content: 'Test record' });
      const result = deleteRecord(record.id);
      expect(result).toBe(true);
    });

    it('should throw error when deleting non-existent record', () => {
      expect(() => deleteRecord('non-existent')).toThrow('Record not found');
    });
  });

  describe('ScoreEvent operations', () => {
    it('should add and retrieve score events', () => {
      const event = addScoreEvent({
        user_id: testUserId,
        action: 'STREAK_DAY',
        score: 3,
        created_at: new Date().toISOString(),
      });
      expect(event.id).toBeDefined();
      expect(event.action).toBe('STREAK_DAY');
      expect(event.score).toBe(3);

      const events = getScoreEvents(testUserId);
      expect(events).toHaveLength(1);
      expect(events[0].action).toBe('STREAK_DAY');
    });

    it('should filter score events by user_id', () => {
      addScoreEvent({
        user_id: testUserId,
        action: 'RECORD_CREATED',
        score: 10,
        created_at: new Date().toISOString(),
      });
      addScoreEvent({
        user_id: 'other-user',
        action: 'RECORD_CREATED',
        score: 10,
        created_at: new Date().toISOString(),
      });

      const events = getScoreEvents(testUserId);
      expect(events).toHaveLength(1);
    });

    it('should return empty array for user with no events', () => {
      const events = getScoreEvents('non-existent-user');
      expect(events).toEqual([]);
    });
  });

});
