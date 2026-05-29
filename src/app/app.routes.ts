import { Routes } from '@angular/router';
import { Login } from './components/login/login';
import { Principal } from './components/principal/principal';
import { Administracion } from './components/administracion/administracion';
import { Perfil } from './components/perfil/perfil';
import { DetalleVivienda } from './components/detalle-vivienda/detalle-vivienda';
import { Mensajes } from './components/mensajes/mensajes';
import { Intercambio } from './components/intercambio/intercambio';
import { Ranking } from './components/ranking/ranking';


export const routes: Routes = [
    {
        path: '',
        component: Login
    },
    {
        path: 'principal',
        component: Principal
    },
    {
        path: 'administracion',
        component: Administracion
    },
    {
        path: 'perfil',
        component: Perfil
    },
    {
        path: 'vivienda/:id',
        component: DetalleVivienda
    },
    {
        path: 'mensajes',
        component: Mensajes
    },
    {
        path: 'intercambio/:id',
        component: Intercambio
    },
    {
        path: 'ranking',
        component: Ranking
    }
];
