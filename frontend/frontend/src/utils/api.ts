const API_URL = 'http://localhost:8000/api' // This is the URL to your Django Ninja backend

export interface Item {
  id: number;
  name: string;
  description: string;
}

export async function fetchItems(): Promise<Item[]> {
  const response = await fetch(`${API_URL}/items`);
  if (!response.ok) {
    throw new Error('Failed to fetch items');
  }
  return response.json();
}

// 🔍 What is async, await, and Promise<Item[]>?
// 1. async Function
// ts
// Copy
// Edit
// export async function fetchItems()
// Marks the function as asynchronous.

// This means it can use await inside.

// It always returns a Promise.

// So, fetchItems() doesn't return data directly—it returns a promise that will resolve later when the data is available.

// 2. Promise<Item[]>
// ts
// Copy
// Edit
// Promise<Item[]>
// This tells TypeScript that:

// When fetchItems() finishes,

// It will give you a list of Item objects like:

// ts
// Copy
// Edit
// [
//   { id: 1, name: "AirPods", description: "Wireless earbuds" },
//   { id: 2, name: "MacBook", description: "M3 laptop" }
// ]
// This helps with type safety so TypeScript knows what kind of data you're working with.

// 3. await fetch(...)
// ts
// Copy
// Edit
// const response = await fetch(`${API_URL}/items`);
// fetch(...) is an asynchronous function that returns a **Promise<Response>`.

// await waits for that Promise to resolve.

// Without await, you'd just get the Promise, not the actual response.

// 4. response.json()
// ts
// Copy
// Edit
// return response.json();
// Converts the raw HTTP response into usable JSON.

// This also returns a Promise, so it gets awaited implicitly by returning it in an async function.

// 📊 Example Flow
// Frontend calls:
// ts
// Copy
// Edit
// const items = await fetchItems();
// Timeline:
// fetchItems() is called — returns a Promise.

// Inside, fetch() sends a GET request to Django Ninja at /api/items.

// await fetch(...) waits for the response.

// If response.ok is false, an error is thrown.

// Otherwise, the response body is parsed into JSON using response.json().

// This JSON is returned — and TypeScript knows it's a list of Item.

// ✅ Summary
// Term	Meaning
// async	Function returns a Promise
// await	Wait for a Promise to resolve
// Promise<Item[]>	Promise that resolves to a list of Item objects
// fetch()	Sends an HTTP request (returns a Promise)
// response.json()	Converts response into JSON

// Let me know if you want an example of how to use this in a React component!



// You said:
// is Promise returns ?

// ChatGPT said:
// Yes — a Promise always returns a value in the future, once the asynchronous operation completes (or fails).

// Let’s clarify this with a few points:

// ✅ What Does a Promise "Return"?
// A Promise itself doesn't return a value immediately, but it eventually either:

// Resolves (succeeds) → and returns a value

// Rejects (fails) → and throws an error

// 🧠 Example: Manual Promise
// ts
// Copy
// Edit
// const promise = new Promise((resolve, reject) => {
//   setTimeout(() => {
//     resolve("Done!");
//   }, 1000);
// });

// promise.then(result => {
//   console.log(result); // 👉 prints "Done!" after 1 second
// });
// 🧠 Example: In fetchItems
// ts
// Copy
// Edit
// export async function fetchItems(): Promise<Item[]> {
//   const response = await fetch(`${API_URL}/items`);
//   if (!response.ok) {
//     throw new Error('Failed to fetch items');
//   }

//   return response.json(); // This returns a Promise<Item[]>
// }
// Even though you're returning response.json(), it's really returning a Promise, because response.json() is also asynchronous.

// 🚨 Important Notes
// await is used to unwrap the result from a Promise.

// Without await, you get the raw Promise — not the data inside.

// 🔁 Full Lifecycle
// ts
// Copy
// Edit
// const dataPromise = fetchItems(); // returns: Promise<Item[]>
// const data = await fetchItems();  // returns: Item[]
// Summary Table
// Code	Returns
// fetchItems()	Promise<Item[]>
// await fetchItems()	Item[] (actual data)
// Promise.resolve('hi')	Promise that resolves to 'hi'
// await Promise.resolve(3)	3

// Let me know if you want to see how Promises behave without async/await.