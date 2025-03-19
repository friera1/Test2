import React, { useState, useEffect } from "react";
import { useI18n } from "@/hooks/use-i18n";
import Header from "@/components/layout/header";
import Footer from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatNumber } from "@/lib/utils";
import { toast } from "@/components/ui/use-toast";
import { type Player, type Rank } from "@/types/player";
import PlayerRankBadge, { getRankLabel } from "@/components/ui/player-rank";

export default function AdminPage() {
  const { t } = useI18n();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedServer, setSelectedServer] = useState<string>("");
  const [serverList, setServerList] = useState<string[]>([]);

  // Загрузка данных игроков
  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/players?sortBy=powerNow&sortOrder=desc");

        if (!response.ok) {
          throw new Error("Failed to fetch players");
        }

        const data = await response.json();

        // Преобразуем данные, добавляя ранги и видимость если их нет
        const playersWithRanks = data.map((player: Player) => ({
          ...player,
          rank: player.rank || 'warrior',
          hidden: player.hidden || false
        }));

        setPlayers(playersWithRanks);

        // Получаем список уникальных серверов
        const servers = [...new Set(playersWithRanks.map((player: Player) => player.server).filter(Boolean))];
        setServerList(servers);
      } catch (error) {
        console.error("Error fetching players:", error);
        toast({
          title: "Ошибка",
          description: "Не удалось загрузить список игроков",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlayers();
  }, []);

  // Функция для обновления ранга игрока
  const updatePlayerRank = async (playerId: number, newRank: Rank) => {
    try {
      const response = await fetch(`/api/admin/players/${playerId}/rank`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rank: newRank })
      });

      if (!response.ok) {
        throw new Error("Failed to update player rank");
      }

      // Обновляем локальное состояние
      setPlayers(players.map(player =>
        player.id === playerId
          ? { ...player, rank: newRank }
          : player
      ));

      // Показываем сообщение об успехе
      toast({
        title: "Успех!",
        description: `Ранг игрока обновлен на ${getRankLabel(newRank)}`
      });
    } catch (error) {
      console.error("Error updating player rank:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить ранг игрока",
        variant: "destructive"
      });
    }
  };

  // Функция для обновления видимости игрока
  const updatePlayerVisibility = async (playerId: number, hidden: boolean) => {
    try {
      const response = await fetch(`/api/admin/players/${playerId}/visibility`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hidden })
      });

      if (!response.ok) {
        throw new Error("Failed to update player visibility");
      }

      // Обновляем локальное состояние
      setPlayers(players.map(player =>
        player.id === playerId
          ? { ...player, hidden }
          : player
      ));

      // Показываем сообщение об успехе
      toast({
        title: "Успех!",
        description: `Видимость игрока изменена: ${hidden ? 'Скрыт' : 'Отображается'}`
      });
    } catch (error) {
      console.error("Error updating player visibility:", error);
      toast({
        title: "Ошибка",
        description: "Не удалось обновить видимость игрока",
        variant: "destructive"
      });
    }
  };

  // Фильтрация игроков
  const filteredPlayers = players
    .filter(player =>
      player.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (player.alliance && player.alliance.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .filter(player =>
      selectedServer ? player.server === selectedServer : true
    );

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container py-8 flex-grow">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{t("adminPanel")}</h1>
        </div>

        <Tabs defaultValue="players">
          <TabsList className="mb-4">
            <TabsTrigger value="players">{t("managePlayers")}</TabsTrigger>
            <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="players">
            <Card>
              <CardHeader>
                <CardTitle>{t("managePlayers")}</CardTitle>
                <CardDescription>
                  {t("adminPanelPlayersDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-6">
                  <div className="flex-1 min-w-[200px]">
                    <Label htmlFor="search">{t("search")}</Label>
                    <Input
                      id="search"
                      placeholder={t("searchPlayerOrAlliance")}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-[200px]">
                    <Label htmlFor="server-filter">{t("server")}</Label>
                    <Select
                      value={selectedServer}
                      onValueChange={setSelectedServer}
                    >
                      <SelectTrigger id="server-filter">
                        <SelectValue placeholder={t("allServers")} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">{t("allServers")}</SelectItem>
                        {serverList.map((server) => (
                          <SelectItem key={server} value={server}>
                            {server}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {loading ? (
                  <div className="text-center py-8">{t("loading")}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("player")}</TableHead>
                          <TableHead>{t("server")}</TableHead>
                          <TableHead>{t("alliance")}</TableHead>
                          <TableHead className="text-right">{t("power")}</TableHead>
                          <TableHead>{t("currentRank")}</TableHead>
                          <TableHead>{t("assignRank")}</TableHead>
                          <TableHead>{t("visibility")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredPlayers.length > 0 ? (
                          filteredPlayers.map((player) => (
                            <TableRow
                              key={player.id}
                              className={player.hidden ? "opacity-50 bg-muted/50" : ""}
                            >
                              <TableCell className="font-medium">{player.nickname}</TableCell>
                              <TableCell>{player.server || "-"}</TableCell>
                              <TableCell>{player.alliance || "-"}</TableCell>
                              <TableCell className="text-right">{player.powerNow ? formatNumber(player.powerNow) : "-"}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <PlayerRankBadge rank={player.rank as Rank} showLabel />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={player.rank as string}
                                  onValueChange={(value) => updatePlayerRank(player.id, value as Rank)}
                                >
                                  <SelectTrigger className="w-[130px]">
                                    <SelectValue placeholder={t("selectRank")} />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="warrior">{t("warrior")}</SelectItem>
                                    <SelectItem value="knight">{t("knight")}</SelectItem>
                                    <SelectItem value="goddess">{t("goddess")}</SelectItem>
                                    <SelectItem value="warGod">{t("warGod")}</SelectItem>
                                    <SelectItem value="emperor">{t("emperor")}</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`hidden-${player.id}`}
                                    checked={!player.hidden}
                                    onCheckedChange={(checked) =>
                                      updatePlayerVisibility(player.id, !checked)
                                    }
                                  />
                                  <label
                                    htmlFor={`hidden-${player.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                  >
                                    {player.hidden ? t("hidden") : t("shown")}
                                  </label>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="h-24 text-center">
                              {t("noPlayersFound")}
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>{t("rankSystemSettings")}</CardTitle>
                <CardDescription>
                  {t("rankSystemSettingsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-4">
                  {t("featureComingSoon")}
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  );
}
