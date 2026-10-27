import React, { createContext, useContext, useState } from 'react';
import { useAuth } from './AuthContext';

export type ProductoCarrito = {
  id: number;
  nombre: string;
  precio: number;
};

export type ItemCarrito = {
  producto: ProductoCarrito;
  cantidad: number;
};

type CarritoState = {
  items: ItemCarrito[];
  total: number;
  cantidadTotal: number;
  agregar: (producto: ProductoCarrito) => void;
  quitar: (productoId: number) => void;
  vaciar: () => void;
};

const CarritoContext = createContext<CarritoState>({
  items: [],
  total: 0,
  cantidadTotal: 0,
  agregar: () => {},
  quitar: () => {},
  vaciar: () => {},
});

export const useCarrito = () => useContext(CarritoContext);

export const CarritoProvider = ({ children }: { children: React.ReactNode }) => {
  const [items, setItems] = useState<ItemCarrito[]>([]);
  const { session } = useAuth();
  const userId = session?.user.id ?? null;

  // Si cambia el usuario (login / logout), el carrito empieza vacío
  const [usuarioCarrito, setUsuarioCarrito] = useState(userId);
  if (usuarioCarrito !== userId) {
    setUsuarioCarrito(userId);
    setItems([]);
  }

  // Suma 1 unidad; si el producto no está, lo agrega
  const agregar = (producto: ProductoCarrito) => {
    setItems((actuales) => {
      const existe = actuales.find((i) => i.producto.id === producto.id);
      if (existe) {
        return actuales.map((i) =>
          i.producto.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        );
      }
      return [...actuales, { producto, cantidad: 1 }];
    });
  };

  // Resta 1 unidad; si llega a 0, lo saca del carrito
  const quitar = (productoId: number) => {
    setItems((actuales) =>
      actuales
        .map((i) => (i.producto.id === productoId ? { ...i, cantidad: i.cantidad - 1 } : i))
        .filter((i) => i.cantidad > 0)
    );
  };

  const vaciar = () => setItems([]);

  const total = items.reduce((suma, i) => suma + i.producto.precio * i.cantidad, 0);
  const cantidadTotal = items.reduce((suma, i) => suma + i.cantidad, 0);

  return (
    <CarritoContext.Provider value={{ items, total, cantidadTotal, agregar, quitar, vaciar }}>
      {children}
    </CarritoContext.Provider>
  );
};
