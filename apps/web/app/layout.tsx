import './globals.css';

export const metadata = {
  title: 'Wishlist',
  description: 'Социальный вишлист с резервом и скидыванием в реалтайме',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>
        <div className="container">
          {children}
        </div>
      </body>
    </html>
  );
}
