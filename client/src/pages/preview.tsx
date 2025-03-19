import React, { useState } from "react";
import { useI18n } from "@/hooks/use-i18n";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";

export default function PreviewPage() {
  const { t } = useI18n();
  const [apiData, setApiData] = useState<{
    players: any[];
    alliances: any[];
  }>({
    players: [],
    alliances: [],
  });

  const createTestData = async () => {
    try {
      // Регистрируем трех пользователей
      const users = [];

      for (let i = 1; i <= 3; i++) {
        const registerResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: `testuser${i}`,
            email: `test${i}@example.com`,
            password: "password123"
          })
        });

        if (registerResponse.ok) {
          const userData = await registerResponse.json();
          users.push(userData);
          console.log(`Создан пользователь ${i}:`, userData);
        } else {
          console.log(`Пользователь testuser${i} уже существует, пробуем войти`);

          // Пытаемся войти
          const loginResponse = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: `testuser${i}`,
              password: "password123"
            })
          });

          if (loginResponse.ok) {
            const userData = await loginResponse.json();
            users.push(userData);
            console.log(`Вошли как пользователь ${i}:`, userData);
          }
        }
      }

      // Создаем профили игроков
      const profiles = [
        {
          characterId: "character1",
          nickname: "Player1",
          server: "Server1",
          alliance: "Alliance1",
          level: 100,
          powerNow: 1000000,
          powerMax: 1200000,
          hiddenPower: 200000
        },
        {
          characterId: "character2",
          nickname: "Player2",
          server: "Server1",
          alliance: "Alliance1",
          level: 90,
          powerNow: 800000,
          powerMax: 900000,
          hiddenPower: 100000
        },
        {
          characterId: "character3",
          nickname: "Player3",
          server: "Server2",
          alliance: "Alliance2",
          level: 110,
          powerNow: 1200000,
          powerMax: 1500000,
          hiddenPower: 300000
        }
      ];

      // Прямой запрос к API сервера для создания тестовых данных
      const createDataResponse = await fetch("/api/test/create-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profiles })
      });

      if (createDataResponse.ok) {
        console.log("Тестовые данные успешно созданы");
        // Обновляем данные на странице
        fetchApiData();
      } else {
        console.error("Ошибка при создании тестовых данных:", await createDataResponse.text());
      }
    } catch (error) {
      console.error("Ошибка при создании тестовых данных:", error);
    }
  };

  const fetchApiData = async () => {
    try {
      // Получаем данные игроков
      const playersResponse = await fetch(
        "/api/rankings/players?sortBy=powerNow&sortOrder=desc"
      );
      const players = await playersResponse.json();

      // Получаем данные альянсов
      const alliancesResponse = await fetch(
        "/api/rankings/alliances?sortBy=totalPower&sortOrder=desc"
      );
      const alliances = await alliancesResponse.json();

      setApiData({
        players,
        alliances,
      });
    } catch (error) {
      console.error("Error fetching API data:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container py-8 flex-grow">
        <h1 className="text-3xl font-bold mb-6">Предпросмотр проекта</h1>

        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Проверка API данных</h2>
          <Button className="mb-4" onClick={fetchApiData}>Загрузить данные API</Button>
          <Button className="mb-4 ml-2" variant="outline" onClick={createTestData}>
            Создать тестовые данные
          </Button>

          <Tabs defaultValue="players">
            <TabsList>
              <TabsTrigger value="players">Игроки ({apiData.players.length})</TabsTrigger>
              <TabsTrigger value="alliances">Альянсы ({apiData.alliances.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="players">
              <Card>
                <CardHeader>
                  <CardTitle>Данные игроков</CardTitle>
                  <CardDescription>Всего игроков: {apiData.players.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  {apiData.players.length === 0 ? (
                    <p>Нет данных игроков</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Ник</th>
                            <th className="text-left p-2">Сервер</th>
                            <th className="text-left p-2">Альянс</th>
                            <th className="text-right p-2">Уровень</th>
                            <th className="text-right p-2">Текущая мощь</th>
                            <th className="text-right p-2">Макс. мощь</th>
                            <th className="text-right p-2">Скрытая мощь</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiData.players.map((player, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{player.nickname}</td>
                              <td className="p-2">{player.server}</td>
                              <td className="p-2">{player.alliance}</td>
                              <td className="text-right p-2">{player.level}</td>
                              <td className="text-right p-2">{player.powerNow?.toLocaleString()}</td>
                              <td className="text-right p-2">{player.powerMax?.toLocaleString()}</td>
                              <td className="text-right p-2">{player.hiddenPower?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alliances">
              <Card>
                <CardHeader>
                  <CardTitle>Данные альянсов</CardTitle>
                  <CardDescription>Всего альянсов: {apiData.alliances.length}</CardDescription>
                </CardHeader>
                <CardContent>
                  {apiData.alliances.length === 0 ? (
                    <p>Нет данных альянсов</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2">Название</th>
                            <th className="text-left p-2">Сервер</th>
                            <th className="text-right p-2">Участников</th>
                            <th className="text-right p-2">Общая мощь</th>
                            <th className="text-right p-2">Средняя мощь</th>
                          </tr>
                        </thead>
                        <tbody>
                          {apiData.alliances.map((alliance, i) => (
                            <tr key={i} className="border-b">
                              <td className="p-2">{alliance.name}</td>
                              <td className="p-2">{alliance.server}</td>
                              <td className="text-right p-2">{alliance.memberCount}</td>
                              <td className="text-right p-2">{alliance.totalPower?.toLocaleString()}</td>
                              <td className="text-right p-2">{alliance.averagePower?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <h2 className="text-2xl font-semibold mb-4">Страницы проекта</h2>
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Главная страница</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Страница, отображаемая при входе на сайт.</p>
              <a href="/" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Рейтинг игроков</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Страница с рейтингом всех игроков.</p>
              <a href="/rankings" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Рейтинг альянсов</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Страница с рейтингом всех альянсов.</p>
              <a href="/alliances" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Профиль</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-2">Страница профиля пользователя (требуется вход).</p>
              <a href="/profile" className="text-blue-500 hover:underline" target="_blank" rel="noopener noreferrer">Открыть в новой вкладке</a>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
}
