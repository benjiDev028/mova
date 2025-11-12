const API_URL = "http://192.168.2.13:8005"; // exemple

export default {
  async createPaymentIntent(data) {
    const res = await fetch(`${API_URL}/payments/create-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  },
};

