import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { tcNo, firstName, lastName, birthYear } = await req.json();

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
        },
        body: soapEnvelope,
      },
    );

    const text = await response.text();
    const isVerified = text.includes(
      "<TCKimlikNoDogrulaResult>true</TCKimlikNoDogrulaResult>",
    );

    return NextResponse.json({ success: isVerified });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Proxy Error" },
      { status: 502 },
    );
  }
}
