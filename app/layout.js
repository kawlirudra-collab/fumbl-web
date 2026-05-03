import "./globals.css";



export const metadata = {

  title: "fumbl.",

  description: "Ceramic objects for your ash.",

};



export default function RootLayout({ children }) {

  return (

    <html lang="en">

      <body>{children}</body>

    </html>

  );

}