import { Routes, Route } from 'react-router-dom';
import PackBuilder from './PackBuilder';
import PackViewer from './PackViewer';
import MyPacks from './MyPacks';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PackBuilder />} />
      <Route path="/my-packs" element={<MyPacks />} />
      <Route path="/pack/:id/edit" element={<PackBuilder />} />
      <Route path="/pack/:id" element={<PackViewer />} />
    </Routes>
  );
}
