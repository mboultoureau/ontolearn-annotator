"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/_components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/app/_components/ui/chart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/_components/ui/tabs";
import { Statistics } from "@prisma/client";
import { useTranslations } from "next-intl";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

type Props = {
    statistics: Statistics[];
}

export default function StatisticsCard({ statistics }: Props) {

    const t = useTranslations("Project.Statistics");

    const chartConfigAccuracy = {
        accuracy: {
            label: t('accuracy'),
            color: "hsl(var(--chart-1))",
        },
    } satisfies ChartConfig

    const chartConfigLoss = {
        loss: {
            label: t('loss'),
            color: "hsl(var(--chart-1))",
        },
    } satisfies ChartConfig

    return (
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>{t('title')}</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
                {statistics.length === 0 ? (
                    <p className="text-center mt-16">{t('empty')}</p>
                ) : (
                    <Tabs defaultValue="loss">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="loss">{t('loss')}</TabsTrigger>
                            <TabsTrigger value="accuracy">{t('accuracy')}</TabsTrigger>
                        </TabsList>
                        <TabsContent value="loss" className="p-4">
                            <ChartContainer config={chartConfigLoss}>
                                <LineChart
                                    accessibilityLayer
                                    data={statistics}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="epoch"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Line
                                        dataKey="loss"
                                        type="linear"
                                        stroke="var(--color-loss)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </TabsContent>
                        <TabsContent value="accuracy" className="p-4">
                            <ChartContainer config={chartConfigAccuracy}>
                                <LineChart
                                    accessibilityLayer
                                    data={statistics}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="epoch"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        domain={[0, 1]}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Line
                                        dataKey="accuracy"
                                        type="linear"
                                        stroke="var(--color-accuracy)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        </TabsContent>
                    </Tabs>

                )}
            </CardContent>
        </Card>
    )
}




