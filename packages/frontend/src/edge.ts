interface EdgeBinding {
  fetch(request: Request): Promise<Response>;
}

interface EdgeEnv {
  readonly API: EdgeBinding;
  readonly ASSETS: EdgeBinding;
}

const proxiedPaths = new Set(["/snapshot", "/spend", "/health"]);

const proxiesToApi = (request: Request): boolean => {
  if (request.method !== "GET") {
    return false;
  }

  return proxiedPaths.has(new URL(request.url).pathname);
};

const edge = {
  fetch(request: Request, env: EdgeEnv): Promise<Response> {
    if (proxiesToApi(request)) {
      return env.API.fetch(request);
    }

    return env.ASSETS.fetch(request);
  },
};

export default edge;
