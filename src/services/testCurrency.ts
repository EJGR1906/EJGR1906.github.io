import { convertCurrency } from "./currencyService";

async function testCurrency() {
  const result = await convertCurrency(
    100,
    "USD",
    "VES"
  );

  console.log("Conversión USD → VES:", result);
}

testCurrency();