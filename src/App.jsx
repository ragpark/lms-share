import { Routes, Route } from 'react-router-dom';
import PackBuilder from './PackBuilder';
import PackViewer from './PackViewer';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PackBuilder />} />
      <Route path="/pack/:id" element={<PackViewer />} />
    </Routes>
  );
}
