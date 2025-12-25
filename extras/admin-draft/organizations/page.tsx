import { db } from "@/lib/db";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function AdminOrgsPage() {
    const orgs = await db.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
            members: true,
            _count: {
                select: { members: true }
            }
        }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Organizations</h2>
                    <p className="text-muted-foreground">Manage workspaces and subscriptions.</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Organization Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Slug</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Members</TableHead>
                                <TableHead>Subscription</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orgs.map((org) => (
                                <TableRow key={org.id}>
                                    <TableCell className="font-medium">{org.name}</TableCell>
                                    <TableCell className="font-mono text-xs text-muted-foreground">{org.slug}</TableCell>
                                    <TableCell>
                                        <Badge variant={org.planTier === 'PRO' ? 'default' : 'secondary'} className={org.planTier === 'PRO' ? 'bg-gradient-to-r from-indigo-500 to-purple-600 border-0' : ''}>
                                            {org.planTier}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{org._count.members}</TableCell>
                                    <TableCell>
                                        <span className={`capitalize text-sm font-medium ${org.subscriptionStatus === 'active' ? 'text-green-500' : 'text-muted-foreground'}`}>
                                            {org.subscriptionStatus || 'Free'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
