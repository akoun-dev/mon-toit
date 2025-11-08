import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import LeaseVerificationBadge from '@/components/ui/lease-verification-badge';
import { LeaseCertificationData } from '@/hooks/useOwnerLeaseCertification';
import { Search, ArrowUpDown } from 'lucide-react';

interface LeaseCertificationTableProps {
  leases: LeaseCertificationData[];
  loading?: boolean;
}

export const LeaseCertificationTable = ({ leases, loading }: LeaseCertificationTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof LeaseCertificationData>('certification_requested_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: keyof LeaseCertificationData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredLeases = leases
    .filter(lease => {
      const matchesSearch = 
        lease.property_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lease.tenant_name?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || lease.certification_status === statusFilter;
      
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      
      if (aVal === null) return 1;
      if (bVal === null) return -1;
      
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getLeaseStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      draft: { label: 'Brouillon', variant: 'outline' },
      active: { label: 'Actif', variant: 'default' },
      expired: { label: 'Expiré', variant: 'secondary' },
      terminated: { label: 'Résilié', variant: 'destructive' },
    };
    
    const config = statusConfig[status] || { label: status, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chargement...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Liste des Baux</CardTitle>
        <CardDescription>
          Vue détaillée des statuts de certification de vos baux
        </CardDescription>
        
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par propriété ou locataire..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="certified">Certifiés</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
              <SelectItem value="not_requested">Non demandés</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('property_title')}
                >
                  <div className="flex items-center gap-1">
                    Propriété
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Locataire</TableHead>
                <TableHead className="text-right">Loyer</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Statut Bail</TableHead>
                <TableHead 
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleSort('certification_status')}
                >
                  <div className="flex items-center gap-1">
                    Certification
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </TableHead>
                <TableHead>Date demande</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLeases.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    Aucun bail trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeases.map((lease) => (
                  <TableRow key={lease.lease_id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {lease.property_image && (
                          <img 
                            src={lease.property_image} 
                            alt={lease.property_title}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <span className="truncate max-w-[200px]">{lease.property_title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{lease.tenant_name}</TableCell>
                    <TableCell className="text-right font-medium">
                      {lease.monthly_rent.toLocaleString()} CFA
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(lease.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' - '}
                      {new Date(lease.end_date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell>
                      {getLeaseStatusBadge(lease.lease_status)}
                    </TableCell>
                    <TableCell>
                      <LeaseVerificationBadge 
                        status={lease.certification_status}
                        verifiedAt={lease.verified_at}
                        variant="compact"
                      />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {lease.certification_requested_at ? (
                        new Date(lease.certification_requested_at).toLocaleDateString('fr-FR', { 
                          day: 'numeric', 
                          month: 'short', 
                          year: 'numeric' 
                        })
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
