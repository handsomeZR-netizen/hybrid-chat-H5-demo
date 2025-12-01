/**
 * End-to-End Integration Tests
 * 
 * These tests validate complete user flows across the entire system,
 * simulating real-world usage scenarios.
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals';
import { WebSocketServer } from '../src/WebSocketServer.js';
import WebSocket from 'ws';
import { StorageService } from '../src/StorageService.js';
import fs from 'fs/promises';

const TEST_PORT = 8090;
const TEST_STORAGE_PATH = './data/test-e2e-messages.json';

describe('End-to-End Integration Tests', () => {
  let server;
  let wsClients = [];

  beforeAll(async () => {
    // Start the WebSocket server
    server = new WebSocketServer(TEST_PORT, TEST_STORAGE_PATH);
    await server.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  afterAll(async () => {
    // Close all client connections
    wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    
    // Stop the server
    if (server && server.wss) {
      server.wss.close();
    }
    
    // Clean up test data
    try {
      await fs.unlink(TEST_STORAGE_PATH);
    } catch (error) {
      // File might not exist
    }
    
    // Wait for cleanup
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  /**
   * Test: Complete Login-Send-Receive Flow
   * 
   * This test validates the entire user journey:
   * 1. User logs in
   * 2. User sends a message
   * 3. Other users receive the message
   * 4. Message is persisted to storage
   */
  test('Complete login-send-receive flow', async () => {
    const user1Id = 'alice';
    const user2Id = 'bob';
    const user3Id = 'charlie';
    const testMessage = 'Hello from Alice!';

    // Track received messages for each user
    const user1Messages = [];
    const user2Messages = [];
    const user3Messages = [];

    // Create WebSocket connections for 3 users
    const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    const ws3 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    
    wsClients.push(ws1, ws2, ws3);

    // Set up message handlers
    ws1.on('message', (data) => {
      user1Messages.push(JSON.parse(data.toString()));
    });
    
    ws2.on('message', (data) => {
      user2Messages.push(JSON.parse(data.toString()));
    });
    
    ws3.on('message', (data) => {
      user3Messages.push(JSON.parse(data.toString()));
    });

    // Wait for all connections to open
    await Promise.all([
      new Promise(resolve => ws1.on('open', resolve)),
      new Promise(resolve => ws2.on('open', resolve)),
      new Promise(resolve => ws3.on('open', resolve))
    ]);

    // Step 1: Users log in
    ws1.send(JSON.stringify({ type: 'LOGIN', userId: user1Id }));
    ws2.send(JSON.stringify({ type: 'LOGIN', userId: user2Id }));
    ws3.send(JSON.stringify({ type: 'LOGIN', userId: user3Id }));

    // Wait for login processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify: All users received system notifications about other users joining
    expect(user1Messages.some(msg => msg.type === 'SYSTEM')).toBe(true);
    expect(user2Messages.some(msg => msg.type === 'SYSTEM')).toBe(true);
    expect(user3Messages.some(msg => msg.type === 'SYSTEM')).toBe(true);

    // Clear messages
    user1Messages.length = 0;
    user2Messages.length = 0;
    user3Messages.length = 0;

    // Step 2: User 1 sends a message
    ws1.send(JSON.stringify({
      type: 'TEXT',
      content: testMessage
    }));

    // Wait for message processing
    await new Promise(resolve => setTimeout(resolve, 200));

    // Step 3: Verify other users received the message
    // User 1 should NOT receive their own message
    const user1TextMessages = user1Messages.filter(msg => msg.type === 'TEXT');
    expect(user1TextMessages.length).toBe(0);

    // User 2 and 3 should receive the message
    const user2TextMessages = user2Messages.filter(msg => msg.type === 'TEXT');
    const user3TextMessages = user3Messages.filter(msg => msg.type === 'TEXT');
    
    expect(user2TextMessages.length).toBe(1);
    expect(user2TextMessages[0].content).toBe(testMessage);
    expect(user2TextMessages[0].senderId).toBe(user1Id);
    
    expect(user3TextMessages.length).toBe(1);
    expect(user3TextMessages[0].content).toBe(testMessage);
    expect(user3TextMessages[0].senderId).toBe(user1Id);

    // Step 4: Verify message was persisted
    const storageService = new StorageService(TEST_STORAGE_PATH);
    await storageService.initialize();
    const allMessages = await storageService.getAllMessages();
    
    const persistedMessage = allMessages.find(msg => 
      msg.type === 'TEXT' && 
      msg.content === testMessage &&
      msg.senderId === user1Id
    );
    
    expect(persistedMessage).toBeDefined();
    expect(persistedMessage.content).toBe(testMessage);
    expect(persistedMessage.senderId).toBe(user1Id);
  }, 10000);

  /**
   * Test: Multi-User Scenario (3+ users simultaneously)
   * 
   * Validates that the system can handle multiple concurrent users
   * sending and receiving messages.
   */
  test('Multi-user scenario with 3 users', async () => {
    const users = ['user1', 'user2', 'user3'];
    const connections = [];
    const messageTrackers = [[], [], []];

    // Create connections for all users
    for (let i = 0; i < users.length; i++) {
      const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
      connections.push(ws);
      wsClients.push(ws);
      
      ws.on('message', (data) => {
        messageTrackers[i].push(JSON.parse(data.toString()));
      });
    }

    // Wait for all connections
    await Promise.all(connections.map(ws => 
      new Promise(resolve => ws.on('open', resolve))
    ));

    // All users log in
    for (let i = 0; i < users.length; i++) {
      connections[i].send(JSON.stringify({
        type: 'LOGIN',
        userId: users[i]
      }));
    }

    await new Promise(resolve => setTimeout(resolve, 300));

    // Clear system messages
    messageTrackers.forEach(tracker => tracker.length = 0);

    // Each user sends a message
    for (let i = 0; i < users.length; i++) {
      connections[i].send(JSON.stringify({
        type: 'TEXT',
        content: `Message from ${users[i]}`
      }));
      
      // Small delay between messages
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Wait for all messages to be processed
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify: Each user received messages from the other users
    for (let i = 0; i < users.length; i++) {
      const textMessages = messageTrackers[i].filter(msg => msg.type === 'TEXT');
      
      // Each user should receive messages from the other 2 users
      expect(textMessages.length).toBe(users.length - 1);
      
      // Verify messages are from other users
      textMessages.forEach(msg => {
        expect(msg.senderId).not.toBe(users[i]);
        expect(users).toContain(msg.senderId);
      });
    }
  }, 15000);

  /**
   * Test: History Loading
   * 
   * Validates that users can load message history.
   */
  test('History loading', async () => {
    const userId = 'history-tester';
    const ws = new WebSocket(`ws://localhost:${TEST_PORT}`);
    wsClients.push(ws);
    
    const messages = [];
    ws.on('message', (data) => {
      messages.push(JSON.parse(data.toString()));
    });

    await new Promise(resolve => ws.on('open', resolve));

    // Login
    ws.send(JSON.stringify({ type: 'LOGIN', userId }));
    await new Promise(resolve => setTimeout(resolve, 200));

    // Send several messages to create history
    for (let i = 0; i < 5; i++) {
      ws.send(JSON.stringify({
        type: 'TEXT',
        content: `History message ${i}`
      }));
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // Clear messages
    messages.length = 0;

    // Request history
    ws.send(JSON.stringify({
      type: 'GET_HISTORY',
      limit: 10
    }));

    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify: Received history response
    const historyResponse = messages.find(msg => msg.type === 'HISTORY_RESPONSE');
    expect(historyResponse).toBeDefined();
    expect(historyResponse.messages).toBeDefined();
    expect(Array.isArray(historyResponse.messages)).toBe(true);
    expect(historyResponse.messages.length).toBeGreaterThan(0);
  }, 10000);

  /**
   * Test: Disconnect and Reconnect
   * 
   * Validates that users can disconnect and reconnect,
   * and that the server properly cleans up sessions.
   */
  test('Disconnect and reconnect', async () => {
    const userId = 'reconnect-tester';
    
    // First connection
    const ws1 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    wsClients.push(ws1);
    
    const messages1 = [];
    ws1.on('message', (data) => {
      messages1.push(JSON.parse(data.toString()));
    });

    await new Promise(resolve => ws1.on('open', resolve));

    // Login
    ws1.send(JSON.stringify({ type: 'LOGIN', userId }));
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify session exists
    const session1 = server.sessionManager.getSession(userId);
    expect(session1).not.toBeNull();
    expect(session1.userId).toBe(userId);

    // Disconnect
    ws1.close();
    await new Promise(resolve => setTimeout(resolve, 300));

    // Verify session was cleaned up
    const sessionAfterDisconnect = server.sessionManager.getSession(userId);
    expect(sessionAfterDisconnect).toBeNull();

    // Reconnect
    const ws2 = new WebSocket(`ws://localhost:${TEST_PORT}`);
    wsClients.push(ws2);
    
    await new Promise(resolve => ws2.on('open', resolve));

    // Login again
    ws2.send(JSON.stringify({ type: 'LOGIN', userId }));
    await new Promise(resolve => setTimeout(resolve, 200));

    // Verify new session exists
    const session2 = server.sessionManager.getSession(userId);
    expect(session2).not.toBeNull();
    expect(session2.userId).toBe(userId);
  }, 10000);
});
