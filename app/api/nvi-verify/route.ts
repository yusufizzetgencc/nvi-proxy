// api/nvi-verify.ts

// Vercel Request & Response tiplerini manuel tanımlıyoruz (npm install yapmaya gerek kalmaz)
interface VercelRequest {
  method?: string;
  body: {
    tcNo?: string;
    firstName?: string;
    lastName?: string;
    birthYear?: number | string;
  };
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (data: any) => VercelResponse;
  end: () => void;
  setHeader: (name: string, value: string | boolean) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS ayarları
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT",
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { tcNo, firstName, lastName, birthYear } = req.body;

    if (!tcNo || !firstName || !lastName || !birthYear) {
      return res.status(400).json({ error: "Eksik parametreler." });
    }

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <TCKimlikNoDogrula xmlns="http://tckimlik.nvi.gov.tr/WS">
      <TCKimlikNo>${tcNo}</TCKimlikNo>
      <Ad>${firstName}</Ad>
      <Soyad>${lastName}</Soyad>
      <DogumYili>${birthYear}</DogumYili>
    </TCKimlikNoDogrula>
  </soap:Body>
</soap:Envelope>`;

    const response = await fetch(
      "https://tckimlik.nvi.gov.tr/Service/KPSPublic.asmx",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/xml; charset=utf-8",
          SOAPAction: "http://tckimlik.nvi.gov.tr/WS/TCKimlikNoDogrula",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        body: soapEnvelope,
      },
    );

    const text = await response.text();
    const isVerified = text.includes(
      "<TCKimlikNoDogrulaResult>true</TCKimlikNoDogrulaResult>",
    );

    return res.status(200).json({ success: isVerified });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return res
      .status(502)
      .json({ success: false, error: "Proxy Error", message: error.message });
  }
}
