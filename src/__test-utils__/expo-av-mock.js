const mockPlayAsync = jest.fn().mockResolvedValue({ isLoaded: true });
const mockStopAsync = jest.fn().mockResolvedValue({});
const mockUnloadAsync = jest.fn().mockResolvedValue({});
const mockGetStatusAsync = jest.fn().mockResolvedValue({ isLoaded: true, isPlaying: false });
const mockSetOnPlaybackStatusUpdate = jest.fn();

const mockSound = {
  playAsync: mockPlayAsync,
  stopAsync: mockStopAsync,
  unloadAsync: mockUnloadAsync,
  getStatusAsync: mockGetStatusAsync,
  setOnPlaybackStatusUpdate: mockSetOnPlaybackStatusUpdate,
};

module.exports = {
  Audio: {
    Sound: {
      createAsync: jest.fn().mockResolvedValue({ sound: mockSound }),
    },
    setAudioModeAsync: jest.fn().mockResolvedValue(undefined),
  },
};
