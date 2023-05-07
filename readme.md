# Fake API in Browser

This module is intended to be used with UNPKG. It will create a mini server in your browser that will let you quickly test your frontend application.The app simulates API behavior by storing data in the browser's LocalStorage. It can handle various CRUD operations, including creating, reading, updating, and deleting data. It has a built in JWT authenticaton support.

Codepen DEMO (fake api): https://codepen.io/drupalastic/pen/dygdvKv?editors=0012

Codepen DEMO (fake api + React): https://codepen.io/drupalastic/pen/GRYQmZX


UNPKG Example: 
```
<script src="https://unpkg.com/fake-api-in-browser@1.0.7/dist/fake-api.js"></script>

```

## Here are example requests for each feature in the application:

### LocalStorage-based Fake API: CRUD operations

```
Create: POST https://mockapi.com/products (with JSON payload)
Read: GET https://mockapi.com/products
Update: PUT https://mockapi.com/products/1 (with JSON payload)
Delete: DELETE https://mockapi.com/products/1
```

### Full-text search: Add q

```
GET https://mockapi.com/products?q=Zebronics
```

### Custom filters: Add custom query parameters


GET https://mockapi.com/products?brand=apple&price=235

### Operators:

```
Add _gte or _lte for getting a range: GET https://mockapi.com/products?price_gte=10&price_lte=300
Add _ne to exclude a value: GET https://mockapi.com/products?id_ne=1
Add _like to filter: GET https://mockapi.com/product?title_like=server
```

### Sorting: Use _sort and _order query parameters
```
GET https://mockapi.com/products?_sort=name,id&_order=asc,desc
```

### Protected routes: Access a protected route with a valid JWT token
```
GET https://mockapi.com/orders (with Authorization: Bearer {JWT_TOKEN} header)
```

### User authentication: Log in with a username and password
```
POST https://mockapi.com/login (with JSON payload containing username, password)
```

```
POST https://mockapi.com/register (with JSON payload containing username, password, firstName, lastName, avatar & email)
```

### Pre populated with data
```
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
```

### Pre-polulated with protected routes settings
```
  const defaultProtectedData = [
    {
      route: "orders",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
      isUserSpecific: true, // in GET request, data filtered by the current user will be returned
    },
  ];
```

### Custom data & protected routes
```
  initializeFakeApiData(<data-see-above-example>);
  setProtectedFakeApiData(<settings-see-above-example>);
```  

### Default users
```
- username: admin, password admin
- username: john, password john
- username: jane, password jane
```



### Example HTML

```
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body>
    <button id="click-me">Click me</button>

    <script src="fake-api-in-browser.js"></script>
    <script>

      document
        .getElementById("click-me")
        .addEventListener("click", async function () {
          try {
            const loginData = {
              username: "john",
              password: "john",
            };

            // make a login request and update these tokens. 
            // maybe token 1 for admin
            // token 2 for john
            const token =
              "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImV4cCI6MTY4MzQ2NTQ0MDcwM30=.c2VjcmV0";

            const token2 = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImV4cCI6MTY4MzQ2NzQ3OTYwOH0=.c2VjcmV0"  

            const newPremiumPost = {
              title: "New Premium Post10",
              author: "John Doe10",
            };
            // const res = await mockFetch("/users");

            // const res = await fetch("https://mockapi.com/login", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            //   body: JSON.stringify(loginData),
            // });

            // const res = await fetch("https://mockapi.com/register", {
            //   method: "POST",
            //   headers: {
            //     "Content-Type": "application/json",
            //   },
            //   body: JSON.stringify({
            //     username: "jane",
            //     password: "jane",
            //     firstName: "Jane",
            //     lastName: "Doe"})
            // })

            // const res = await fetch(
            //   "https://mockapi.com/orders/",
            //   {
            //     method: "POST",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization:  'Bearer ' + token,
            //     },
            //     body: JSON.stringify({
            //       items: [
            //         {productId: 3, quantity: 3},
            //         {productId: 4, quantity: 3}
            //       ]
            //     })
            //   }
            // );


            // const res = await fetch(
            //   "https://mockapi.com/orders/3",
            //   {
            //     method: "PUT",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     },
            //     body: JSON.stringify({
            //       items: [
            //         {productId: 3, quantity: 30},
            //         {productId: 4, quantity: 40}
            //       ]
            //     })
            //   }
            // );

            // const res = await fetch(
            //   "https://mockapi.com/products?q=ap&_sort=id&_order=desc&brand=Apple&price_lte=250",
            //   {
            //     method: "GET",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     }
            //   }
            // );


            // const res = await fetch(
            //   "https://mockapi.com/products?q=ronics&_limit=3&_page=1&_sort=id&_order=desc",
            //   {
            //     method: "GET",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     },
            //   }
            // );

            // const res = await fetch(
            //   "https://mockapi.com/orders/",
            //   {
            //     method: "GET",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     }
            //   }
            // );

            // const res = await fetch(
            //   "https://mockapi.com/employees",
            //   {
            //     method: "GET",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     },
            //   }
            // );

            // works with fetch normally with other urls
            // const res = await fetch(
            //   "https://jsonplaceholder.typicode.com/todos/1?q=abc"
            //   {
            //     method: "GET",
            //     headers: {
            //       "Content-Type": "application/json",
            //       Authorization: token,
            //     },
            //   }
            // );


            console.log(res);
            const data = await res.json();
            console.log(data);
          } catch (err) {
            console.log(err);
          }
        });
    </script>
  </body>
</html>


```