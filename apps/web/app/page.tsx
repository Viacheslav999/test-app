import Link from 'next/link';
import { Card, Button } from '@/components/ui';

export default function Home() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h1 className='text-2xl font-semibold'>Wishlist</h1>
      </div>
      <Card className='p-5 space-y-3'>
        <p className='text-gray-700'>
          Создавай вишлисты, делись ссылкой, друзья резервируют подарки и скидываются. Всё обновляется в реальном времени.
        </p>
        <div className='flex gap-2'>
          <Link href='/register'><Button>Регистрация</Button></Link>
          <Link href='/login'><Button>Войти</Button></Link>
          <Link href='/app'><Button className='bg-gray-900 text-white border-gray-900 hover:bg-gray-800'>В приложение</Button></Link>
        </div>
      </Card>
    </div>
  );
}
