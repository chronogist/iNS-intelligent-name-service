import { redirect } from 'next/navigation';

export default function ExplorePage() {
  // Redirect /explore to the marketplace
  redirect('/marketplace');
}