import { Button } from '@/components/ui';
import { useFavorites } from '@/hooks/useFavorites';
import type { Route } from '@/types/domain';

interface SaveRouteButtonProps {
  route: Route;
}

export function SaveRouteButton({ route }: SaveRouteButtonProps) {
  const { favorites, isSaved, addFavorite, removeFavorite } = useFavorites();
  const destinationPlaceId = route.legs[0]?.to.placeId;
  const savedFavorite = favorites.find(
    (favorite) => favorite.to.placeId === destinationPlaceId,
  );
  const saved = destinationPlaceId ? isSaved(destinationPlaceId) : false;

  return (
    <Button
      title={saved ? 'Saved. Tap to remove' : 'Save to favorites'}
      variant={saved ? 'secondary' : 'primary'}
      accessibilityLabel={
        saved ? 'Remove this destination from favorites' : 'Save this destination to favorites'
      }
      onPress={() => {
        if (savedFavorite) {
          removeFavorite(savedFavorite.id);
        } else {
          addFavorite(route);
        }
      }}
    />
  );
}