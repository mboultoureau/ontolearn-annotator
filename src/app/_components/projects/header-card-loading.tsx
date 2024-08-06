import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";

export type Props = {
    title: string;
    icon: ReactNode;
}

export default function HeaderCardLoading({ title, icon } : Props) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    <Skeleton className="h-8 w-[20px]" />
                </div>
                    <Skeleton className="mt-2 h-4 w-[170px]" />
            </CardContent>
        </Card>
    )
}