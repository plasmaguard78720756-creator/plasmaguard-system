import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const ReportarFalla = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { id } = useParams();
  
  const [observaciones, setObservaciones] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fallaDetalle = {
    id: parseInt(id),
    tipo: 'Temperatura',
    descripcion: 'Temperatura fuera de rango permitido',
    fecha: '2024-01-20 10:30:00',
    valor_medido: '23.25°C',
    valor_esperado: '-25°C a -35°C',
    sensor_afectado: 'PT100'
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!observaciones.trim()) {
      alert('Por favor ingresa observaciones sobre la falla');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('✅ Reporte enviado exitosamente al servicio técnico');
      navigate('/operador/dashboard');
      
    } catch (error) {
      alert('❌ Error al enviar el reporte');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImprimir = async () => {
    try {
      const element = document.getElementById('reporte-pdf');
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`reporte-falla-${fallaDetalle.id}.pdf`);
      
      alert('📄 PDF generado exitosamente');
    } catch (error) {
      console.error('Error generando PDF:', error);
      alert('❌ Error al generar el PDF');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-plasma-primary">PLASMAGUARD</h1>
          <p className="text-gray-600 mt-2">Seguridad y Confianza</p>
        </div>

        {/* Información del usuario */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-lg font-semibold text-gray-800">
                Bienvenido: <span className="text-plasma-primary">{user?.name || 'Usuario'}</span>
              </p>
              <p className="text-gray-600">Acceso: Operador</p>
            </div>
            <button
              onClick={() => navigate('/operador/dashboard')}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition"
            >
              ← Volver al Dashboard
            </button>
          </div>
        </div>

        {/* Contenido principal */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              📋 Informe de Falla #{fallaDetalle.id}
            </h2>

            {/* Sección para PDF */}
            <div id="reporte-pdf" className="bg-white p-6 border-2 border-dashed border-gray-300 mb-6">
              {/* Encabezado PDF */}
              <div className="text-center mb-6 border-b-2 border-gray-300 pb-4">
                <h1 className="text-2xl font-bold text-plasma-primary">PLASMAGUARD</h1>
                <p className="text-gray-600">Sistema de Monitoreo de Plasma</p>
                <p className="text-gray-500 text-sm">Reporte de Falla - {new Date().toLocaleDateString()}</p>
              </div>

              {/* Información de la falla */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Información de la Falla</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Número de Falla:</span>
                      <span className="font-medium">#{fallaDetalle.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tipo:</span>
                      <span className="font-medium">{fallaDetalle.tipo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sensor:</span>
                      <span className="font-medium">{fallaDetalle.sensor_afectado}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha y Hora:</span>
                      <span className="font-medium">{fallaDetalle.fecha}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Medido:</span>
                      <span className="font-medium text-red-600">{fallaDetalle.valor_medido}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Valor Esperado:</span>
                      <span className="font-medium text-green-600">{fallaDetalle.valor_esperado}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Descripción de la Falla</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded border">
                  {fallaDetalle.descripcion}
                </p>
              </div>

              {/* Observaciones del Operador */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Observaciones del Operador</h3>
                <div className="bg-yellow-50 border border-yellow-200 p-3 rounded min-h-[100px]">
                  {observaciones || '(El operador no ingresó observaciones)'}
                </div>
              </div>

              {/* Información del Reporte */}
              <div className="grid grid-cols-2 gap-4 text-sm border-t-2 border-gray-300 pt-4">
                <div>
                  <span className="text-gray-600">Reportado por:</span>
                  <p className="font-medium">{user?.name || 'Operador'}</p>
                </div>
                <div>
                  <span className="text-gray-600">Fecha de Reporte:</span>
                  <p className="font-medium">{new Date().toLocaleString()}</p>
                </div>
              </div>

              {/* Espacio para firmas */}
              <div className="mt-8 grid grid-cols-2 gap-8 border-t-2 border-gray-300 pt-4">
                <div className="text-center">
                  <div className="border-b border-gray-300 pb-8 mb-2"></div>
                  <p className="text-sm text-gray-600">Firma del Operador</p>
                </div>
                <div className="text-center">
                  <div className="border-b border-gray-300 pb-8 mb-2"></div>
                  <p className="text-sm text-gray-600">Firma del Servicio Técnico</p>
                </div>
              </div>
            </div>

            {/* Formulario de observaciones */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones y Comentarios *
                </label>
                <textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-plasma-primary transition"
                  placeholder="Describe los detalles de la falla, acciones tomadas, y cualquier observación relevante..."
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Estas observaciones serán enviadas al servicio técnico para su revisión.
                </p>
              </div>

              {/* Botones de acción */}
              <div className="flex space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-green-500 text-white py-3 px-6 rounded-lg hover:bg-green-600 transition font-medium disabled:bg-green-300 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '🔄 Enviando...' : '📤 Enviar al Servicio Técnico'}
                </button>
                
                <button
                  type="button"
                  onClick={handleImprimir}
                  className="flex-1 bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  🖨️ Imprimir Reporte
                </button>
                
                <button
                  type="button"
                  onClick={() => navigate('/operador/dashboard')}
                  className="flex-1 bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition font-medium"
                >
                  ← Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportarFalla;