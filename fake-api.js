(function (global) {
  const keyPrefix = "fakeCollection_";

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
    const [encodedHeader, encodedPayload, encodedSignature] = jwt.split(".");

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
    const hasKeyPrefix = key.startsWith(keyPrefix);
    const hasUserSuffix = key.endsWith("__user") || key.endsWith("__default");

    if (hasKeyPrefix && hasUserSuffix) {
      return JSON.parse(localStorage.getItem(key));
    }

    const userKey = key + "__user";
    const defaultKey = key + "__default";
    const userData = JSON.parse(localStorage.getItem(keyPrefix + userKey));
    const defaultData = JSON.parse(
      localStorage.getItem(keyPrefix + defaultKey)
    );

    return userData ? userData : defaultData;
  }

  function setLocalStorageData(key, data, isUserProvided = true) {
    const suffix = isUserProvided ? "__user" : "__default";
    localStorage.setItem(keyPrefix + key + suffix, JSON.stringify(data));
  }

  function getLocalStorageCollections() {
    const schema = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith(keyPrefix)) {
        const collectionName = key.split("__")[1];
        const collectionType = key.split("__")[2];

        // If a user collection is found, it should take precedence
        if (collectionType === "user") {
          schema[collectionName] = true;
        } else if (collectionType === "default" && !schema[collectionName]) {
          // If a default collection is found and there is no user collection,
          // use the default collection
          schema[collectionName] = true;
        }
      }
    }

    return schema;
  }

  function getLocalStorageSchema() {
    const schema = {};

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);

      if (key.startsWith(keyPrefix)) {
        schema[key] = true;
      }
    }

    return schema;
  }

  function updateLocalStorageData(key, newData) {
    const data = getLocalStorageData(key);
    if (!data) {
      throw new Error(`Data for key "${key}" not found`);
    }
    const updatedData = data.map((item) =>
      item.id === newData.id ? newData : item
    );
    setLocalStorageData(key, updatedData);
  }

  function initializeFakeApiData(initialData, isUserProvided = true) {
    for (const key in initialData) {
      if (!getLocalStorageData(key, isUserProvided)) {
        setLocalStorageData(key, initialData[key], isUserProvided);
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
    const currentData = JSON.parse(
      localStorage.getItem("protectedData") || "[]"
    );
    if (currentData.length === 0) {
      localStorage.setItem("protectedData", JSON.stringify(data));
    }
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
  
    // Find the user key or the default key
    const localStorageKeys = Object.keys(getLocalStorageSchema());
    let userKey, defaultKey;
  
    for (const key of localStorageKeys) {
      if (key.includes(lastPart)) {
        if (key.includes("__user")) {
          userKey = key;
        } else if (key.includes("__default")) {
          defaultKey = key;
        }
      }
    }
  
    // Return the user key if it exists, otherwise return the default key
    const key = userKey || defaultKey;
    return key;
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

    console.log("key", key);
    console.log("id", id);
    console.log("queryParams", queryParams);

    let data;

    if (method === "GET" && id) {
      data = await getByIdHandler(key, id);
    } else if (method === "GET") {
      data = await getAllHandler(key);

      if (queryParams.q) {
        data = getAllByFullTextSearch(data, queryParams.q);
      }

      if (queryParams._limit !== undefined || queryParams._page !== undefined) {
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
            console.log(item)
            console.log(url);
            console.log(getKeyFromUrl(url))
            const urlKey = getKeyFromUrl(url).toLowerCase().trim();
            const itemRouteKey = item.route.toLowerCase().trim();
            return urlKey === itemRouteKey;
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

  // Default data
  const defaultInitialData = {
    orders: [
      {
        id: 1,
        userId: 1,
        items: [
          { productId: 1, quantity: 2 },
          { productId: 2, quantity: 1 },
        ],
        discount: 0,
      },
    ],
    products: [
      {
        id: 1,
        brand: "Zebronics",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/n/y/nyfboat000113_1_cc965b26.jpg?rnd=20200526195200",
        price: 100,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Laptop",
      },
      {
        id: 2,
        brand: "Zebronics",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/n/y/nyfblta000011_1.jpg?rnd=20200526195200",
        price: 120,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Mobile",
      },
      {
        id: 3,
        brand: "Zebronics",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/b/c/bc60a_1_c82d81cb.jpg?rnd=20200526195200",
        price: 130,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Head_Phones",
      },
      {
        id: 4,
        brand: "Zebronics",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/6/1/619660798426_1_727221ba.jpg?rnd=20200526195200",
        price: 100,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Speakers",
      },
      {
        id: 5,
        brand: "Zebronics",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/c/_/c_8907605107849_1_655fcbdf.jpg?rnd=20200526195200",
        price: 200,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Smart_TV",
      },
      {
        id: 6,
        brand: "Apple",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/c/o/cor-nyfcrca000039_1_369033fe.jpg?rnd=20200526195200",
        price: 235,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Laptop",
      },
      {
        id: 7,
        brand: "Apple",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/a/m/ambrane_8904258106557_1_aff3c266.jpg?rnd=20200526195200",
        price: 250,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Mobile",
      },
      {
        id: 8,
        brand: "Apple",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/n/y/nyfblta000009_1.jpg?rnd=20200526195200",
        price: 100,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Head_Phones",
      },
      {
        id: 9,
        brand: "Apple",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/z/b/zb_8906108615899_1_44867a4c.jpg?rnd=20200526195200",
        price: 325,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Speakers",
      },
      {
        id: 10,
        brand: "Apple",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/u/d/ud_bk_1_2f275806.jpg?rnd=20200526195200",
        price: 350,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Smart_TV",
      },
      {
        id: 11,
        brand: "HP",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/g/r/grey_1_398b5873.jpg?rnd=20200526195200",
        price: 375,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Laptop",
      },
      {
        id: 12,
        brand: "HP",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/b/o/boult-audio-ba-nk-freepods-black_1_17c2dc71.jpg?rnd=20200526195200",
        price: 100,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Mobile",
      },
      {
        id: 13,
        brand: "HP",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/d/i/dive_green_1.jpg?rnd=20200526195200",
        price: 500,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Head_Phones",
      },
      {
        id: 14,
        brand: "HP",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/p/e/pebble-8906086572115_1_34a9b9fd.jpg?rnd=20200526195200",
        price: 1000,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Speakers",
      },
      {
        id: 15,
        brand: "HP",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/p/p/pportronics-por-1195_1_e9dc8e9f.jpg?rnd=20200526195200",
        price: 750,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Smart_TV",
      },
      {
        id: 16,
        brand: "Dell",
        img: "https://adn-static1.nykaa.com/nykdesignstudio-images/tr:w-550,/pub/media/catalog/product/m/u/musebud_grey.jpg?rnd=20200526195200",
        price: 1500,
        details:
          "Lorem ipsum dolor sit amet consectetur adipisicing elit. Iusto, sequi.",
        category: "Laptop",
      },
    ],
    users: [
      {
        id: 1,
        username: "admin",
        password: "admin",
        firstName: "Vivek",
        lastName: "Agarwal",
      },
    ],
  };
  const defailtProtectedData = [
    {
      route: "orders",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      isUserSpecific: true, // in GET request, data filtered by the current user will be returned
    },
  ];

  // Initialize the data
  initializeFakeApiData(defaultInitialData, false);
  setProtectedFakeApiData(defailtProtectedData);

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
