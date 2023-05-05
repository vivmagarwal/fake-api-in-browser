(function (global) {
  function generateJWT(userId) {
    const header = {
      alg: "HS256",
      typ: "JWT",
    };

    const payload = {
      userId,
      exp: Date.now() + 3 * 60 * 60 * 1000, // Expires in 3 hours
    };

    const signature = "secret"; // Replace this with your own secret

    const encodedHeader = btoa(JSON.stringify(header));
    const encodedPayload = btoa(JSON.stringify(payload));
    const encodedSignature = btoa(signature);

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  }

  function verifyJWT(jwt) {
    const [encodedHeader, encodedPayload, encodedSignature] =
      jwt.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
      return false;
    }

    const header = JSON.parse(atob(encodedHeader));
    const payload = JSON.parse(atob(encodedPayload));
    const signature = atob(encodedSignature);

    // Check if the signature is valid
    if (signature !== "secret") {
      return false;
    }

    // Check if the token is expired
    if (Date.now() > payload.exp) {
      return false;
    }

    return true;
  }

  function getLocalStorageData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }

  function setLocalStorageData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  function updateLocalStorageData(key, newData) {
    const existingData = getLocalStorageData(key);
    const updatedData = { ...existingData, ...newData };
    setLocalStorageData(key, updatedData);
  }

  function initializeFakeApiData(initialData) {
    for (const key in initialData) {
      if (!getLocalStorageData(key)) {
        setLocalStorageData(key, initialData[key]);
      }
    }

    if (!getLocalStorageData("users")) {
      setLocalStorageData("users", [
        {
          id: 1,
          username: "admin",
          password: "admin",
          firstName: "Vivek",
          lastName: "Agarwal",
        },
      ]);
    }
  }

  function setProtectedFakeApiData(data) {
    localStorage.setItem("protectedData", JSON.stringify(data));
  }

  function registerHandler(body) {
    const userData = JSON.parse(body);
    const users = getLocalStorageData("users");
    userData.id = users.length + 1;
    users.push(userData);
    setLocalStorageData("users", users);
    return new Response(
      JSON.stringify({ message: "User registered successfully" }),
      {
        status: 201,
      }
    );
  }

  function loginHandler(body) {
    const { username, password } = JSON.parse(body);
    const users = getLocalStorageData("users");
    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (user) {
      return new Response(JSON.stringify({ token: generateJWT(user.id) }), {
        status: 200,
      });
    } else {
      throw new Error("Invalid credentials");
    }
  }

  function getAllHandler(key) {
    const data = getLocalStorageData(key);
    return new Response(JSON.stringify(data), { status: 200 });
  }

  function getAllByFullTextSearch(key, query) {
    const data = getLocalStorageData(key);

    const filteredData = data.filter((item) => {
      const values = Object.values(item);
      return values.some((value) =>
        value.toString().toLowerCase().includes(query.toLowerCase())
      );
    });

    return new Response(JSON.stringify(filteredData), { status: 200 });
  }

  function getByIdHandler(key, id) {
    const data = getLocalStorageData(key);
    console.log(key);
    const item = data.find((item) => item.id === id); // Updated line

    if (item) {
      return new Response(JSON.stringify(item), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "Not Found" }), {
        status: 400,
      });
    }
  }

  function postHandler(key, body) {
    const data = getLocalStorageData(key);

    const newItem = JSON.parse(body);
    if (!newItem.id) {
      const maxId =
        data.length > 0 ? Math.max(...data.map((item) => item.id)) : 0;
      newItem.id = maxId + 1;
    }

    data.push(newItem);
    setLocalStorageData(key, data);

    return new Response(JSON.stringify(newItem), { status: 201 });
  }

  function putHandler(key, id, body) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id === id);

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    const updatedItem = JSON.parse(body);
    updatedItem.id = id;
    data[index] = updatedItem;
    setLocalStorageData(key, data);

    return new Response(JSON.stringify(updatedItem), { status: 200 });
  }

  function deleteHandler(key, id) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id === id);

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    data.splice(index, 1);
    setLocalStorageData(key, data);

    return new Response(null, { status: 204 });
  }

  function patchHandler(key, id, body) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id === id);

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    const newData = JSON.parse(body);
    data[index] = { ...data[index], ...newData };
    setLocalStorageData(key, data);

    return new Response(JSON.stringify(data[index]), { status: 200 });
  }

  function fullTextSearch(data, query) {
    return data.filter((item) =>
      Object.values(item).some((value) =>
        String(value).toLowerCase().includes(query.toLowerCase())
      )
    );
  }

  function customFilter(data, customFilters) {
    return data.filter((item) =>
      customFilters.every(([param, value]) => {
        if (!item.hasOwnProperty(param)) {
          return true;
        }
        return item[param] == value;
      })
    );
  }

  function sortData(data, sortKeys, sortOrder) {
    return data.sort((a, b) => {
      for (let i = 0; i < sortKeys.length; i++) {
        const key = sortKeys[i];
        const order = sortOrder[i] === "desc" ? -1 : 1;

        if (a[key] < b[key]) {
          return -1 * order;
        } else if (a[key] > b[key]) {
          return order;
        }
      }
      return 0;
    });
  }

  function getFilteredDataHandler(key, queryParams) {
    let data = getLocalStorageData(key);

    // Full-text search
    if (queryParams.q) {
      data = fullTextSearch(data, queryParams.q);
    }

    // Custom filter for any other query parameters
    const customFilters = Object.entries(queryParams).filter(
      ([param]) => !["q", "_sort", "_order"].includes(param)
    );
    data = customFilter(data, customFilters);

    // Sorting
    if (queryParams._sort) {
      const sortKeys = queryParams._sort.split(",");
      const sortOrder = queryParams._order
        ? queryParams._order.split(",")
        : sortKeys.map(() => "asc");

      data = sortData(data, sortKeys, sortOrder);
    }

    const response = new Response(JSON.stringify(data), { status: 200 });
    return Promise.resolve(response);
  }

  function getKeyFromUrl(url) {
    const BASE_URL = "https://mockapi.com";
    const urlWithoutBaseUrl = url.replace(BASE_URL, "");
    const urlWithoutQueryParams = urlWithoutBaseUrl.split("?")[0];
    const urlParts = urlWithoutQueryParams.split("/");
    const lastPart = urlParts[urlParts.length - 1];
    return Object.keys(initialData).find((k) => k === lastPart);
  }

  function getIdFromUrl(url) {
    const idMatch = url.match(/\/(\d+)$/);
    return idMatch ? parseInt(idMatch[1], 10) : null;
  }

  function getQueryParamsFromUrl(url) {
    const queryParamsMatch = url.match(/\?(.*)/);
    const queryParams = queryParamsMatch
      ? Object.fromEntries(
          queryParamsMatch[1].split("&").map((p) => p.split("="))
        )
      : {};

    return queryParams;
  }

  function getPaginatedDataHandler(data, limit, page) {
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = data.slice(start, end);
    const totalCount = data.length;

    const responseHeaders = {
      "Content-Type": "application/json",
      "X-Total-Count": totalCount,
    };

    const response = new Response(JSON.stringify(paginatedData), {
      status: 200,
      headers: responseHeaders,
    });

    return response;
  }

  async function handleCRUDOperations(url, method, body) {
    const key = getKeyFromUrl(url);
    const id = getIdFromUrl(url);
    const queryParams = getQueryParamsFromUrl(url);

    let data;

    if (method === "GET" && id) {
      data = await getByIdHandler(key, id);
    } else if (method === "GET") {
      data = await getAllHandler(key);

      if (queryParams.q) {
        data = getAllByFullTextSearch(data, queryParams.q);
      }

      if (
        queryParams._limit !== undefined ||
        queryParams._page !== undefined
      ) {
        const limit = parseInt(queryParams._limit, 10) || 10;
        const page = parseInt(queryParams._page, 10) || 1;
        return getPaginatedDataHandler(data, limit, page);
      } else if (Object.keys(queryParams).length > 0) {
        data = getFilteredDataHandler(data, queryParams);
      }
    } else if (method === "POST") {
      data = await postHandler(key, body);
    } else if (method === "PUT" && id) {
      data = await putHandler(key, id, body);
    } else if (method === "DELETE" && id) {
      data = await deleteHandler(key, id);
    } else if (method === "PATCH" && id) {
      data = await patchHandler(key, id, body);
    } else {
      throw new Error(`Invalid request for url: ${url}`);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  function getAllHandler(key) {
    const data = getLocalStorageData(key);
    return data;
  }

  function getByIdHandler(key, id) {
    const data = getLocalStorageData(key);
    const item = data.find((item) => item.id === id);
    return item;
  }

  function getAllByFullTextSearch(data, searchTerm) {
    const filteredData = data.filter((item) => {
      const values = Object.values(item);
      return values.some((value) => {
        return value
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      });
    });
    return filteredData;
  }

  async function mockFetch(url, options = {}) {
    const { method = "GET", headers, body } = options;

    return new Promise((resolve, reject) => {
      // Simulate network latency
      setTimeout(async () => {
        try {
          // Check if JWT is required and verify it
          const protectedData = JSON.parse(
            localStorage.getItem("protectedData") || "[]"
          );
          const protectedRoute = protectedData.find((item) => {
            return (
              getKeyFromUrl(url).toLowerCase().trim() ===
              item.route.toLowerCase().trim()
            );
          });

          if (
            protectedRoute &&
            protectedRoute.methods.includes(method) &&
            (!headers ||
              !headers.Authorization ||
              !verifyJWT(headers.Authorization))
          ) {
            throw new Error("Unauthorized");
          }

          // Handle special routes: /register and /login
          if (url.endsWith("/register") && method === "POST") {
            const response = registerHandler(body);
            resolve(response);
            return;
          }

          if (url.endsWith("/login") && method === "POST") {
            const response = loginHandler(body);
            resolve(response);
            return;
          }

          // Handle CRUD operations
          const response = handleCRUDOperations(url, method, body);
          if (response) {
            resolve(response);
          } else {
            throw new Error(`Unknown route: ${url}`);
          }
        } catch (error) {
          reject(error);
        }
      }, Math.floor(Math.random() * 500) + 100);
    }).catch((error) => {
      // Simulate fetch Response object
      const status = error.message === "Unauthorized" ? 401 : 400;
      return {
        ok: false,
        status: status,
        message: error.message,
        json: () => Promise.resolve({ error: error.message }),
      };
    });
  }


  // Expose functions
  global.initializeFakeApiData = initializeFakeApiData;
  global.setProtectedFakeApiData = setProtectedFakeApiData;

  // Override fetch
  const originalFetch = global.fetch;
  global.fetch = async function (url, options) {
    if (url.includes("mockapi.com")) {
      return mockFetch(url, options);
    } else {
      return originalFetch(url, options);
    }
  };
})(typeof window !== "undefined" ? window : module.exports);
