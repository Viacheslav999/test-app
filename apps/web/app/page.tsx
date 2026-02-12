import Link from "next/link";
import { Card, Button } from "@/components/ui";

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Заголовок */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight">
          Вишлист
        </h1>
        <p className="text-gray-600 max-w-xl">
          Создавай списки желаний и делись ссылкой. Друзья бронируют подарки и
          скидываются — всё обновляется в реальном времени.
        </p>
      </div>

      {/* Карточка */}
      <Card className="p-6 space-y-5">
        <div className="space-y-3 text-gray-700">
          <div className="font-semibold text-gray-900">
            Как это работает
          </div>
          <ol className="list-decimal pl-5 space-y-1 text-sm">
            <li>Зарегистрируйся и создай вишлист</li>
            <li>Добавь подарки (ссылка, цена, картинка)</li>
            <li>
              Отправь публичную ссылку друзьям — регистрация им не нужна
            </li>
          </ol>
        </div>

        {/* Кнопки */}
        <div className="flex flex-wrap gap-3 pt-2">
          <Link href="/register">
            <Button>Регистрация</Button>
          </Link>

          <Link href="/login">
            <Button variant="ghost">Войти</Button>
          </Link>

          <Link href="/app">
            <Button className="bg-gray-900 text-white border-gray-900 hover:bg-gray-800">
              В приложение
            </Button>
          </Link>
        </div>

        <div className="text-xs text-gray-500">
          Публичные вишлисты открываются по ссылке вида <b>/w/XXXXXX</b>
        </div>
      </Card>
    </div>
  );
}
