import React from 'react'
import { Header } from '~/components'
import type { LoaderFunctionArgs } from "react-router";
import { getTripById, getAllTrips } from '~/appwrite/trips';
import { parseTripData } from 'lib/utils';
import type { Route } from "./+types/trips";


export const loader = async ({ params }: LoaderFunctionArgs) => {
    const { tripId } = params;
    if(!tripId) throw new Error ('Trip ID is required');

    const [trip, trips] = await Promise.all([
        getTripById(tripId),
        getAllTrips(4, 0)
    ]);

    return {
        trip,
        allTrips: trips.allTrips.map(({ $id, tripDetail, imageUrls }) => ({
            id: $id,
            ...parseTripData(tripDetail),
            imageUrls: imageUrls ?? []
        }))
    }
}


export const Trips = ({ loaderData }: Route.ComponentProps) => {
  return (
    <main className="all-users wrapper">
        <Header
         title="Trips"
         description="View and edit AI-generated travel plans"
        ctaText="Create New Trip"
        ctaUrl="/trips/create"
        />
    </main>
  )
}

export default Trips;