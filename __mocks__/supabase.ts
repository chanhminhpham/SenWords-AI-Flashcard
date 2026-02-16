const mockAuth = {
  signInWithOAuth: jest.fn(),
  signOut: jest.fn(),
  getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
  onAuthStateChange: jest
    .fn()
    .mockReturnValue({ data: { subscription: { unsubscribe: jest.fn() } } }),
};

const mockFrom = jest.fn().mockReturnValue({
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn().mockResolvedValue({ data: null, error: null }),
});

const mockSupabase = {
  auth: mockAuth,
  from: mockFrom,
};

export function getSupabase() {
  return mockSupabase;
}
