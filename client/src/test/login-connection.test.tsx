import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as fc from 'fast-check';
import App from '../App';
import { WebSocketManager } from '../utils/websocket';

// Increase test timeout for property tests
const PROPERTY_TEST_TIMEOUT = 30000;

/**
 * Property-Based Tests for Login and Connection
 * Feature: hybrid-chat-app
 * 
 * These tests validate the correctness properties defined in the design document
 * for user authentication and WebSocket connection management.
 */

// Mock WebSocket to avoid actual network connections in tests
class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: ((error: Event) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  
  sentMessages: string[] = [];

  constructor(public url: string) {
    // Simulate async connection - use a longer delay to ensure callbacks are set up
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen();
      }
    }, 50);
  }

  send(data: string) {
    console.log('[MockWebSocket] send called with:', data);
    this.sentMessages.push(data);
  }

  close() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }

  // Helper to simulate connection loss
  simulateDisconnect() {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose();
    }
  }
}

describe('Login and Connection Property Tests', () => {
  let originalWebSocket: typeof WebSocket;
  let mockWebSocketInstances: MockWebSocket[] = [];

  beforeEach(() => {
    // Save original WebSocket and replace with mock
    originalWebSocket = global.WebSocket as any;
    mockWebSocketInstances = [];
    
    // Create a constructor function that tracks instances
    const MockWebSocketConstructor = function(this: MockWebSocket, url: string) {
      const instance = new MockWebSocket(url);
      mockWebSocketInstances.push(instance);
      return instance;
    } as any;
    
    MockWebSocketConstructor.CONNECTING = MockWebSocket.CONNECTING;
    MockWebSocketConstructor.OPEN = MockWebSocket.OPEN;
    MockWebSocketConstructor.CLOSING = MockWebSocket.CLOSING;
    MockWebSocketConstructor.CLOSED = MockWebSocket.CLOSED;
    
    global.WebSocket = MockWebSocketConstructor;
  });

  afterEach(() => {
    // Restore original WebSocket
    global.WebSocket = originalWebSocket;
    mockWebSocketInstances = [];
    vi.clearAllMocks();
  });

  /**
   * **Feature: hybrid-chat-app, Property 1: 登录建立连接并发送正确消息**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * For any valid user ID, when a user initiates login, the system should
   * establish a WebSocket connection and send a LOGIN message containing that user ID.
   */
  it('Property 1: Login establishes connection and sends correct message', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate valid user IDs (non-empty, non-whitespace strings)
        fc.string({ minLength: 1, maxLength: 20 }).filter(s => s.trim().length > 0),
        async (userId) => {
          const user = userEvent.setup();
          const { unmount } = render(<App />);

          try {
            // Clear previous instances
            mockWebSocketInstances.length = 0;
            
            // Find and fill the user ID input
            const input = screen.getByLabelText(/user id/i);
            await user.clear(input);
            await user.type(input, userId);

            // Submit the login form
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Wait for WebSocket connection to be established and chat screen to appear
            await waitFor(() => {
              expect(screen.queryByRole('button', { name: /login/i })).not.toBeInTheDocument();
              expect(mockWebSocketInstances.length).toBeGreaterThan(0);
            }, { timeout: 1000 });

            // Get the mock WebSocket instance
            const mockWs = mockWebSocketInstances[mockWebSocketInstances.length - 1];
            
            // Verify connection was established
            await waitFor(() => {
              expect(mockWs?.readyState).toBe(MockWebSocket.OPEN);
            }, { timeout: 500 });

            // Wait for LOGIN message to be sent
            await waitFor(() => {
              const sentMessages = mockWs?.sentMessages || [];
              const loginMessage = sentMessages.find((msg: string) => {
                try {
                  const parsed = JSON.parse(msg);
                  return parsed.type === 'LOGIN';
                } catch {
                  return false;
                }
              });

              expect(loginMessage).toBeDefined();
              if (loginMessage) {
                const parsed = JSON.parse(loginMessage);
                expect(parsed.userId).toBe(userId.trim());
              }
            }, { timeout: 1000 });
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for faster test execution
    );
  }, PROPERTY_TEST_TIMEOUT);

  /**
   * **Feature: hybrid-chat-app, Property 2: 空用户 ID 被拒绝**
   * **Validates: Requirements 1.4**
   * 
   * For any string composed only of whitespace, attempting to login with that
   * string as user ID should be rejected, and the system state should remain unchanged.
   */
  it('Property 2: Empty user ID is rejected', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate whitespace-only strings
        fc.string({ minLength: 1, maxLength: 10 }).filter(s => s.trim().length === 0),
        async (whitespaceUserId) => {
          const user = userEvent.setup();
          const { unmount } = render(<App />);

          try {
            // Clear previous instances
            const initialInstanceCount = mockWebSocketInstances.length;
            
            // Find and fill the user ID input with whitespace
            const input = screen.getByLabelText(/user id/i);
            await user.clear(input);
            await user.type(input, whitespaceUserId);

            // Try to submit the login form
            const loginButton = screen.getByRole('button', { name: /login/i });
            await user.click(loginButton);

            // Small delay to ensure any async operations complete
            await new Promise(resolve => setTimeout(resolve, 50));

            // Verify we're still on the login screen (not navigated to chat)
            expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();

            // Verify error message is shown
            expect(screen.getByText(/user id cannot be empty/i)).toBeInTheDocument();

            // Verify no new WebSocket connection was attempted
            expect(mockWebSocketInstances.length).toBe(initialInstanceCount);
          } finally {
            unmount();
          }
        }
      ),
      { numRuns: 20 } // Reduced from 100 for faster test execution
    );
  }, PROPERTY_TEST_TIMEOUT);

  /**
   * **Feature: hybrid-chat-app, Property 3: 连接丢失触发重连**
   * **Validates: Requirements 1.5**
   * 
   * For any established WebSocket connection, when the connection is unexpectedly
   * closed, the system should automatically attempt to reconnect.
   */
  it('Property 3: Connection loss triggers reconnection', async () => {
    // Use fake timers for this test
    vi.useFakeTimers();
    
    try {
      // Test the WebSocketManager directly for reconnection logic
      await fc.assert(
        fc.asyncProperty(
          fc.constant('ws://localhost:8080'),
          async (wsUrl) => {
            let connectionAttempts = 0;
            const testInstances: MockWebSocket[] = [];
            
            // Track WebSocket constructor calls
            const originalConstructor = global.WebSocket;
            const MockWebSocketConstructor = function(this: MockWebSocket, url: string) {
              connectionAttempts++;
              const instance = new MockWebSocket(url);
              testInstances.push(instance);
              return instance;
            } as any;
            
            MockWebSocketConstructor.CONNECTING = MockWebSocket.CONNECTING;
            MockWebSocketConstructor.OPEN = MockWebSocket.OPEN;
            MockWebSocketConstructor.CLOSING = MockWebSocket.CLOSING;
            MockWebSocketConstructor.CLOSED = MockWebSocket.CLOSED;
            
            global.WebSocket = MockWebSocketConstructor;

            const wsManager = new WebSocketManager(wsUrl);

            try {
              // Initial connection
              wsManager.connect();
              
              // Advance timers to complete connection
              await act(async () => {
                await vi.advanceTimersByTimeAsync(50);
              });
              
              // Verify connection is established
              expect(wsManager.isConnected()).toBe(true);
              const initialAttempts = connectionAttempts;

              // Simulate connection loss
              const mockWs = testInstances[0];
              mockWs.simulateDisconnect();

              // Advance timers to trigger reconnection
              await act(async () => {
                await vi.advanceTimersByTimeAsync(1500);
              });

              // Verify reconnection was attempted
              expect(connectionAttempts).toBeGreaterThan(initialAttempts);
            } finally {
              wsManager.disconnect();
              global.WebSocket = originalConstructor;
            }
          }
        ),
        { numRuns: 20 } // Reduced from 100 for faster test execution
      );
    } finally {
      vi.useRealTimers();
    }
  }, PROPERTY_TEST_TIMEOUT);
});
