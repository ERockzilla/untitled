
import { VoxelTetris } from '../components/games/VoxelTetris';
import { useAutoTitle } from '../lib/useAutoTitle';

export function VoxelTetrisPage() {
    useAutoTitle('VoxTris 3D');

    return <VoxelTetris />;
}
