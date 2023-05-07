(function (global) {
  const keyPrefix = "fakeCollection_";

  function trimBearerPrefix(str) {
    return str.replace(/^Bearer\s+/i, "");
  }

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
    let token = trimBearerPrefix(jwt);
    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

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

  function getUserIdFromJwt(jwt) {
    let token = trimBearerPrefix(jwt);

    try {
      if (!verifyJWT(token)) {
        console.error("Invalid or expired JWT token");
        return null;
      }

      const encodedPayload = token.split(".")[1];
      const payloadBase64 = encodedPayload
        .replace(/-/g, "+")
        .replace(/_/g, "/");
      const payloadJson = atob(payloadBase64);
      const payload = JSON.parse(payloadJson);

      const userId = payload.userId; // Assuming the payload contains a "userId" claim
      return userId;
    } catch (error) {
      console.error("Error decoding JWT token:", error);
      return null;
    }
  }

  function getLocalStorageDataByCreator(key, isUserProvided = true) {
    const hasKeyPrefix = key.startsWith(keyPrefix);
    const hasUserSuffix = key.endsWith("__user") || key.endsWith("__default");

    if (hasKeyPrefix && hasUserSuffix) {
      return JSON.parse(localStorage.getItem(key));
    }

    const userKey = key + "__user";
    const defaultKey = key + "__default";

    if (isUserProvided) {
      const userData = JSON.parse(localStorage.getItem(keyPrefix + userKey));
      return userData;
    } else {
      const defaultData = JSON.parse(
        localStorage.getItem(keyPrefix + defaultKey)
      );
      return defaultData;
    }
  }

  // returns userData if avaliable else defaultData
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
    if (
      key.startsWith(keyPrefix) &&
      (key.endsWith("__user") || key.endsWith("__default"))
    ) {
      localStorage.setItem(key, JSON.stringify(data));
    } else {
      const suffix = isUserProvided ? "__user" : "__default";
      localStorage.setItem(keyPrefix + key + suffix, JSON.stringify(data));
    }
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

  function initializeFakeApiData(initialData, isUserProvided = true) {
    for (const key in initialData) {
      if (!getLocalStorageDataByCreator(key, isUserProvided)) {
        setLocalStorageData(key, initialData[key], isUserProvided);
      }
    }

    if (!getLocalStorageDataByCreator("users", isUserProvided)) {
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

  function setProtectedFakeApiData(data, isUserProvided = true) {
    const currentData = JSON.parse(
      localStorage.getItem("protectedData") || "[]"
    );

    if (isUserProvided || currentData.length === 0) {
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

  function postHandler(key, body, options) {
    const data = getLocalStorageData(key);
    const newItem = JSON.parse(body);
    const isRouteUserSpecific = options && options.isRouteUserSpecific;
    const userIdFromToken = options && options.userId;

    if (userIdFromToken && isRouteUserSpecific && !newItem.userId) {
      newItem["userId"] = userIdFromToken;
    }

    if (!newItem.id) {
      const maxId =
        data.length > 0 ? Math.max(...data.map((item) => item.id)) : 0;
      newItem.id = maxId + 1;
    }

    data.push(newItem);
    setLocalStorageData(key, data);

    return new Response(JSON.stringify(newItem), { status: 201 });
  }

  function putHandler(key, id, body, options) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id == id);
    const isRouteUserSpecific = options && options.isRouteUserSpecific;
    const userIdFromToken = options && options.userId;

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    const updatedItem = JSON.parse(body);
    updatedItem.id = id;

    if (userIdFromToken && isRouteUserSpecific && !newItem.userId) {
      newItem["userId"] = userIdFromToken;
    }

    data[index] = updatedItem;
    setLocalStorageData(key, data);

    return new Response(JSON.stringify(updatedItem), { status: 200 });
  }

  function deleteHandler(key, id) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id == id);

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    data.splice(index, 1);
    setLocalStorageData(key, data);

    return new Response(JSON.stringify({ deleted: id }), { status: 200 });
  }

  function patchHandler(key, id, body, options) {
    const data = getLocalStorageData(key);
    const index = data.findIndex((item) => item.id == id);
    const isRouteUserSpecific = options && options.isRouteUserSpecific;
    const userIdFromToken = options && options.userId;

    if (index === -1) {
      throw { status: 404, message: "Not Found" };
    }

    const newData = JSON.parse(body);

    if (userIdFromToken && isRouteUserSpecific && !newItem.userId) {
      newItem["userId"] = userIdFromToken;
    }

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

  function applyCustomFilters(data, customFilters) {
    const filteredData = [];

    for (const item of data) {
      let matchesAllFilters = true;

      for (const [param, value] of customFilters) {
        const operatorMatch = param.match(/(.+)(_gte|_lte|_ne|_like)$/);

        if (operatorMatch) {
          const [, originalParam, operator] = operatorMatch;

          switch (operator) {
            case "_gte":
              if (
                item.hasOwnProperty(originalParam) &&
                item[originalParam] < value
              ) {
                matchesAllFilters = false;
              }
              break;
            case "_lte":
              if (
                item.hasOwnProperty(originalParam) &&
                item[originalParam] > value
              ) {
                matchesAllFilters = false;
              }
              break;
            case "_ne":
              if (
                item.hasOwnProperty(originalParam) &&
                item[originalParam] == value
              ) {
                matchesAllFilters = false;
              }
              break;
            case "_like":
              if (
                item.hasOwnProperty(originalParam) &&
                !item[originalParam].includes(value)
              ) {
                matchesAllFilters = false;
              }
              break;
          }
        } else if (item.hasOwnProperty(param) && item[param] != value) {
          matchesAllFilters = false;
        }

        if (!matchesAllFilters) {
          break;
        }
      }

      if (matchesAllFilters) {
        filteredData.push(item);
      }
    }

    return filteredData;
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

  function getFilteredDataHandler(data, queryParams, id) {
    // Full-text search
    if (queryParams.q) {
      data = fullTextSearch(data, queryParams.q);
    }

    // Sorting
    if (queryParams._sort) {
      const sortKeys = queryParams._sort.split(",");
      const sortOrder = queryParams._order
        ? queryParams._order.split(",")
        : sortKeys.map(() => "asc");

      data = sortData(data, sortKeys, sortOrder);
    }

    // Custom filter for any other query parameters
    const filterKeys = ["q", "_sort", "_order", "_limit", "_page"];
    const customFilters = Object.entries(queryParams).filter(
      ([param]) => !filterKeys.includes(param)
    );
    data = applyCustomFilters(data, customFilters);

    // Pagination
    if (queryParams._limit !== undefined || queryParams._page !== undefined) {
      const limit = parseInt(queryParams._limit, 10) || 10;
      const page = parseInt(queryParams._page, 10) || 1;
      data = getPaginatedDataHandler(data, limit, page);
    }

    return data;
    // const response = new Response(JSON.stringify(data), { status: 200 });
    // return Promise.resolve(response);
  }

  function getKeyFromUrl(url) {
    const BASE_URL = "https://mockapi.com";
    const urlWithoutBaseUrl = url.replace(BASE_URL, "");
    const urlWithoutQueryParams = urlWithoutBaseUrl.split("?")[0];
    const urlParts = urlWithoutQueryParams.split("/");
    const keyPart = urlParts[1];
    const localStorageKeys = Object.keys(getLocalStorageSchema());

    let userKey, defaultKey;

    // find defaultKey
    defaultKey = localStorageKeys.find(
      (item) => item.endsWith("__default") && item.includes(keyPart.trim())
    );

    // find userKey
    userKey = localStorageKeys.find(
      (item) => item.endsWith("__user") && item.includes(keyPart.trim())
    );

    // Return the user key if it exists, otherwise return the default key
    const key = userKey || defaultKey;
    return key;
  }

  function getIdFromUrl(url) {
    const BASE_URL = "https://mockapi.com";
    const urlWithoutBaseUrl = url.replace(BASE_URL, "");
    const urlWithoutQueryParams = urlWithoutBaseUrl.split("?")[0];
    const urlParts = urlWithoutQueryParams.split("/");
    const idPart = urlParts[2];
    return idPart;
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
    return paginatedData;
  }

  async function handleCRUDOperations(url, method, body, options) {
    const key = getKeyFromUrl(url);
    const id = getIdFromUrl(url);
    const queryParams = getQueryParamsFromUrl(url);
    const isRouteUserSpecific = options && options.isRouteUserSpecific;
    const userIdFromToken = options && options.userId;

    let data;
    let totalCount;

    if (method === "GET") {
      data = await getAllHandler(key);
      totalCount = data.length || 0;

      if (isRouteUserSpecific) {
        data = applyCustomFilters(data, [["userId", userIdFromToken]]);
      }

      if (id) {
        data = applyCustomFilters(data, [["id", id]]);
      }

      if (Object.keys(queryParams).length > 0) {
        data = getFilteredDataHandler(data, queryParams);
      }
    } else if (method === "POST") {
      return await postHandler(key, body, {
        isRouteUserSpecific: isRouteUserSpecific,
        userId: userIdFromToken,
      });
    } else if (method === "PUT" && id) {
      return await putHandler(key, id, body);
    } else if (method === "DELETE" && id) {
      return await deleteHandler(key, id);
    } else if (method === "PATCH" && id) {
      return await patchHandler(key, id, body);
    } else {
      throw new Error(`Invalid request for url: ${url}`);
    }

    const responseHeaders = {
      "Content-Type": "application/json",
      "X-Total-Count": totalCount,
    };

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: responseHeaders,
    });
  }

  function getAllHandler(key) {
    const data = getLocalStorageData(key);
    return data;
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

          let protectedRoute = false;
          let isRouteUserSpecific = false;
          let userId;

          console.log('protectedData: ', protectedData)

          for (let i = 0; i < protectedData.length; i++) {
            let keyFromUrl = getKeyFromUrl(url); //fakeCollection_products__default

            console.log('keyFromUrl: ', keyFromUrl)

            if (keyFromUrl) {
              const itemRouteKey = protectedData[i].route.toLowerCase().trim(); // orders
              console.log('itemRouteKey: ', itemRouteKey);

              let trimmedKeyFromUrl = keyFromUrl.replace("fakeCollection_","");
              trimmedKeyFromUrl = trimmedKeyFromUrl.replace("__default","");

              console.log("trimmedKeyFromUrl: ", trimmedKeyFromUrl);

              if (
                trimmedKeyFromUrl.trim().toLowerCase() ===
                itemRouteKey.trim().toLowerCase()
              ) {
                protectedRoute = protectedData[i];
                isRouteUserSpecific = protectedData[i].isUserSpecific;
                break;
              }
            }
          }

          console.log('protectedRoute: ', protectedRoute)

          if (
            protectedRoute &&
            protectedRoute.methods.includes(method) &&
            (!headers ||
              !headers.Authorization ||
              !verifyJWT(headers.Authorization))
          ) {
            throw new Error("Unauthorized");
          }


          if (protectedRoute && protectedRoute.methods.includes(method) && headers.Authorization && verifyJWT(headers.Authorization)) {
            let headerAuthToken = headers.Authorization;
            if (headerAuthToken) {
              userId = getUserIdFromJwt(headerAuthToken)
            };
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
          const response = handleCRUDOperations(url, method, body, {
            isRouteUserSpecific: isRouteUserSpecific,
            userId: userId,
          });
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
      {
        id: 2,
        userId: 2,
        items: [
          { productId: 3, quantity: 3 },
          { productId: 4, quantity: 1 },
        ],
        discount: 100,
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
        avatar: "https://reqres.in/img/faces/9-image.jpg",
        email: "admin@mail.com",
      },
      {
        id: 2,
        username: "john",
        password: "john",
        firstName: "John",
        lastName: "Doe",
        avatar: "https://reqres.in/img/faces/8-image.jpg",
        email: "john@mail.com",
      },
      {
        id: 3,
        username: "jane",
        password: "jane",
        firstName: "Jane",
        lastName: "Doe",
        avatar: "https://reqres.in/img/faces/7-image.jpg",
        email: "jane@mail.com",
      },
    ],
  };
  const defaultProtectedData = [
    {
      route: "orders",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      isUserSpecific: true, // in GET request, data filtered by the current user will be returned
    },
  ];

  // Initialize the data
  initializeFakeApiData(defaultInitialData, false);
  setProtectedFakeApiData(defaultProtectedData, false);

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
