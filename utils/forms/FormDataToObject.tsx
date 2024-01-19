// export default function transformKeysToObject(formData: FormData) {
//   const resultObject: { [key: string]: any } = {};
//   const o = Object.fromEntries(formData);

//   for (const key in o) {
//     const keys: string[] = key.split(".");

//     let currentObject = resultObject;
//     keys.forEach((nestedKey, index) => {
//       if (nestedKey.includes("[") && nestedKey.includes("]")) {
//         const arrayKey = nestedKey.split("[")[0];
//         const arrayIndex = nestedKey.match(/\[(.*?)\]/)![1];

//         if (!currentObject.hasOwnProperty(arrayKey)) {
//           currentObject[arrayKey] = [{}];
//         }

//         if (index === keys.length - 1) {
//           currentObject[arrayKey][arrayIndex] = o[key];
//         } else {
//           currentObject = currentObject[arrayKey][arrayIndex];
//         }
//       } else {
//         const keyName = nestedKey;

//         if (!currentObject[keyName]) {
//           currentObject[keyName] = {};
//         }

//         if (index === keys.length - 1) {
//           currentObject[keyName] = o[key];
//         } else {
//           currentObject = currentObject[keyName];
//         }
//       }
//     });
//   }

//   return resultObject;
// }

// Example usage
// const originalObject: Record<string, any> = {
//   "ticket[1].name.first": "John",
//   "ticket[2].billing.address": "123 Main St",
//   "ticket[1].name.last": "Doe",
// };

// const transformedObject: NestedObject = transformKeysToObject(originalObject);

// console.log(transformedObject[1].name.first); // Output: John
// console.log(transformedObject[2]["billing"]["address"]); // Output: 123 Main St
