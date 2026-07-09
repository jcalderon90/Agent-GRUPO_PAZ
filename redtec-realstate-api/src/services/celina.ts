export interface Lot {
    id: string;
    precio: number;
    superficie: number;
    ubicacion: string;
    estado: 'disponible' | 'reservado' | 'vendido';
}

export interface LotSearchFilters {
    precio_max?: number;
    ubicacion?: string;
}

export interface CelinaClient {
    searchLots(filters: LotSearchFilters): Promise<Lot[]>;
}

class CelinaMockClient implements CelinaClient {
    private lots: Lot[] = [
        // ← ACÁ vas a escribir vos 5-8 objetos Lot de ejemplo,
        //    con distintos precios/ubicaciones/estados.
        //    Cada uno con la forma: { id: '1', precio: 45000, superficie: 300, ubicacion: 'Zona Norte', estado: 'disponible' }
    ];

    async searchLots(filters: LotSearchFilters): Promise<Lot[]> {
        // ← ACÁ filtrás this.lots según filters.precio_max y filters.ubicacion
        //    Pista: usá this.lots.filter(lot => ...)
        //    Si filters.precio_max existe, solo dejar lotes con lot.precio <= filters.precio_max
        //    Si filters.ubicacion existe, solo dejar lotes cuya ubicacion la incluya (podés usar .includes() o comparar en minúsculas)
    }
}

export const celinaClient: CelinaClient = new CelinaMockClient();