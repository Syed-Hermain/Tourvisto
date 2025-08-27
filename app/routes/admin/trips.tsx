// src/routes/trips.tsx
import {
  type LoaderFunctionArgs,        // ← loader args type
                     // ← for correct headers, caching, etc.
  useLoaderData,             // ← grab loader return on the client
  useNavigate,
  useSearchParams
} from "react-router";
import { Header, TripCard } from "~/components";
import { PagerComponent } from "@syncfusion/ej2-react-grids";
import { getAllTrips } from "~/appwrite/trips";
import { parseTripData } from "lib/utils";


////////////////////////////////////////////////////////////////////////////////
// 1) Loader (server-side)
////////////////////////////////////////////////////////////////////////////////

export async function loader({ request }: LoaderFunctionArgs) {
  const url         = new URL(request.url);
  const currentPage = Number(url.searchParams.get("page") ?? "1");
  const pageSize    = 4;
  const offset      = (currentPage - 1) * pageSize;

  const { allTrips, total } = await getAllTrips(pageSize, offset);
  console.log(
    `[loader] page=${currentPage}  limit=${pageSize}  offset=${offset}  fetched=${allTrips.length}`
  );

  return ({
    trips: allTrips.map(({ $id, tripDetail, imageUrls }) => ({
      id: $id,
      ...parseTripData(tripDetail),
      imageUrls: imageUrls ?? []
    })),
    totalRecords: total,
    currentPage,
    pageSize
  });
}

////////////////////////////////////////////////////////////////////////////////
// 2) Component (client-side)
////////////////////////////////////////////////////////////////////////////////

interface LoaderData {
  trips: Trip[];
  totalRecords: number;
  currentPage: number;
  pageSize: number;
}

export default function Trips() {
  const { trips, totalRecords, currentPage, pageSize } =
    useLoaderData() as LoaderData;

  const [searchParams] = useSearchParams();
  const navigate        = useNavigate();

  // Always derive from the URL so state + URL stay in sync:
  const page = Number(searchParams.get("page") ?? String(currentPage));

  const handlePageChange = (newPage: number) => {
    // push a new URL (no full refresh)
    navigate({ pathname: "/trips", search: `?page=${newPage}` });
  };

  return (
    <main className="wrapper all-trips">
      <Header
        title="Trips"
        description="View and edit AI-generated travel plans"
        ctaText="Create a trip"
        ctaUrl="/trips/create"
      />

      <section>
        <h1 className="p-24-semibold text-dark-100 mb-4">
          Manage Created Trips
        </h1>

        <div className="trip-grid mb-4">
          {trips.map((trip) => (
            <TripCard
              key={trip.id}
              id={trip.id}
              name={trip.name}
              imageUrl={trip.imageUrls[0]}
              location={trip.itinerary?.[0]?.location ?? ""}
              tags={[trip.interests, trip.travelStyle]}
              price={trip.estimatedPrice}
            />
          ))}
        </div>

        <PagerComponent
          totalRecordsCount={totalRecords}
          pageSize={pageSize}
          currentPage={page}
          click={({ currentPage }) => handlePageChange(currentPage)}
          cssClass="!mb-4"
        />
      </section>
    </main>
  );
}