'use client'

import { FC, JSX } from 'react'
import { FileText } from 'lucide-react'

interface TableProps {
  headers: string[]
  rows: (string | number | JSX.Element)[][]
}

const Table: FC<TableProps> = ({ headers, rows }) => (
  <div className="overflow-x-auto bg-white rounded-xl shadow-lg border border-gray-100">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
        <tr>
          {headers.map((header) => (
            <th key={header} scope="col" className="px-6 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider">
              {header}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-100">
        {rows.length > 0 ? (
          rows.map((row, i) => (
            <tr key={i} className="hover:bg-blue-50 transition-colors duration-200">
              {row.map((cell, j) => (
                <td key={j} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {cell}
                </td>
              ))}
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={headers.length} className="px-6 py-8 text-center text-gray-500">
              <div className="flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-300 mb-2" />
                <span>لا توجد بيانات</span>
              </div>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)

export default Table
