import { Package, Plus, Search } from 'lucide-react'
const PRODUCTS = [
  { id:'TL-001', name:'Glossy White 600x600',  brand:'RAK',    category:'Floor Tiles', size:'600x600', finish:'Glossy', price:'₹65/sqft',  stock:280, unit:'boxes' },
  { id:'TL-002', name:'Matte Grey 800x800',    brand:'Kajaria', category:'Floor Tiles', size:'800x800', finish:'Matte',  price:'₹90/sqft',  stock:145, unit:'boxes' },
  { id:'TL-003', name:'Marble Look 600x1200',  brand:'Somany',  category:'Floor Tiles', size:'600x1200',finish:'Satin',  price:'₹120/sqft', stock:68,  unit:'boxes' },
  { id:'TL-004', name:'Wood Finish Wall Tile',  brand:'Johnson', category:'Wall Tiles',  size:'300x600', finish:'Matte',  price:'₹48/sqft',  stock:12,  unit:'boxes' },
  { id:'TL-005', name:'Anti-Skid Outdoor 400x400',brand:'Orient',category:'Outdoor',   size:'400x400', finish:'Rough',  price:'₹38/sqft',  stock:320, unit:'boxes' },
]
export function ProductsPage() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold text-slate-800">Products</h1><p className="text-sm text-slate-500">Tiles catalog, variants and pricing</p></div>
        <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 shadow-sm"><Plus className="h-4 w-4"/>Add Product</button>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>{['SKU','Product Name','Brand','Category','Size','Finish','Selling Price','Stock',''].map(h=><th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {PRODUCTS.map(p=>(
              <tr key={p.id} className="hover:bg-slate-50">
                <td className="px-5 py-3.5 font-mono text-xs text-slate-500">{p.id}</td>
                <td className="px-5 py-3.5 font-medium text-slate-800">{p.name}</td>
                <td className="px-5 py-3.5 text-slate-600">{p.brand}</td>
                <td className="px-5 py-3.5 text-slate-600">{p.category}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{p.size}</td>
                <td className="px-5 py-3.5 text-xs text-slate-500">{p.finish}</td>
                <td className="px-5 py-3.5 font-semibold text-slate-800">{p.price}</td>
                <td className="px-5 py-3.5"><span className={`text-xs font-semibold ${p.stock < 20 ? 'text-red-600' : 'text-emerald-700'}`}>{p.stock} {p.unit}</span></td>
                <td className="px-5 py-3.5"><button className="text-xs text-blue-600 hover:underline font-medium">Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
