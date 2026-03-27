import { ListingWizard } from '@/components/host/ListingWizard';

export default function NewListingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <ListingWizard mode="create" />
    </div>
  );
}
