import request from 'supertest';
import app from '../index';

jest.mock('axios', () => {
  const getMock = jest.fn(async (_url: string, options?: any) => {
    return {
      data: {
        location: { lat: 1, lon: 2, timezone: 'UTC', country: 'KE' },
        current: {
          time: new Date().toISOString(),
          temperature: 25,
          wind_speed: 5,
          condition_code: 'clear',
          icon: 'https://example.com/icon.png',
        },
        daily: [],
      },
      headers: {},
    };
  });

  // Minimal AxiosHeaders stand-in so `instanceof AxiosHeaders` checks work
  class AxiosHeaders {
    private store: Record<string, string> = {};
    constructor(init?: Record<string, string>) {
      if (init) this.store = { ...init };
    }
    get(name: string) {
      return this.store[name] ?? this.store[name.toLowerCase()];
    }
    set(name: string, value: string) {
      this.store[name] = value;
    }
  }

  const interceptors = {
    request: { use: jest.fn(() => undefined) },
    response: { use: jest.fn(() => undefined) },
  };

  return {
    AxiosHeaders,
    create: jest.fn(() => ({ get: getMock, interceptors })),
  };
});

jest.mock('../utils/cropAdvice', () => ({
  getCropAdvice: jest.fn(async (_cropType: string, _risk: any, _forecast: any) => {
    return 'Mock crop advice from Gemini';
  }),
}));

const axios = require('axios');

describe('GET /api/weather', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('forwards cropType query param to WeatherAI client', async () => {
    const mockCreate = axios.create as jest.MockedFunction<typeof axios.create>;
    const mockClient = mockCreate.mock.results[0].value;
    // ensure mock exists
    expect(mockCreate).toBeCalled();

    const lat = 0.5;
    const lon = 36.8;
    const cropType = 'maize';

    const res = await request(app).get('/api/weather').query({ lat, lon, cropType });
    if (res.status !== 200) {
      // expose server error body for debugging
      // eslint-disable-next-line no-console
      console.error('server error body:', res.body);
    }
    expect(res.status).toBe(200);

    // the mocked client.get should have been called at least once
    expect(mockClient.get).toBeCalled();
    const [[calledUrl, calledOpts]] = (mockClient.get as jest.Mock).mock.calls;

    // ensure we called the external weather endpoint
    expect(calledUrl).toBe('/v1/weather');

    // options.params should contain cropType
    expect(calledOpts).toBeDefined();
    expect(calledOpts.params).toBeDefined();
    expect(calledOpts.params.cropType).toBe(cropType);

    // route responded with expected json shape wrapper
    expect(res.body).toHaveProperty('data');
    expect(res.body.data).toHaveProperty('weather');
  });
});
