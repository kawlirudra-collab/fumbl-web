export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }

  const { name, email, country } = body ?? {};
  if (!name?.trim() || !email?.trim() || !country?.trim()) {
    return Response.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.MAILCHIMP_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const [, dc] = apiKey.split("-");
  const listId = "15b81a86ea";

  const mcRes = await fetch(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`anystring:${apiKey}`).toString("base64")}`,
    },
    body: JSON.stringify({
      email_address: email.trim(),
      status: "subscribed",
      merge_fields: {
        FNAME: name.trim(),
        COUNTRY: country.trim(),
      },
    }),
  });

  const data = await mcRes.json();

  if (!mcRes.ok) {
    if (data.title === "Member Exists") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: data.detail ?? "Subscription failed" }, { status: 400 });
  }

  return Response.json({ ok: true });
}
