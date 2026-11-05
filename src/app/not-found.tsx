import Link from 'next/link';

export default function NoEncontrada() {
  return (
    <main className="principal">
      <div className="tarjeta vacio">
        <h1>No se ha encontrado</h1>
        <p>La página no existe o no tienes permiso para verla.</p>
        <Link className="boton boton--oscuro" href="/">Volver a las pólizas</Link>
      </div>
    </main>
  );
}
