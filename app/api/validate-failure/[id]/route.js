import { NextResponse } from "next/server";


export async function POST(
  request,
  { params }
) {

  try {


    const { id } = await params;



        const token = process.env.AVTR_TOKEN;


    if (!token) {

      return NextResponse.json(
        {
          error: "Token missing"
        },
        {
          status: 500
        }
      );

    }



    const response = await fetch(

      `https://api.avtr.jo/api/service-provider/failures/${id}/validate`,

      {

        method: "POST",

        headers: {

          "Content-Type": "application/json",

          "Authorization": `Bearer ${token}`

        },

        body: JSON.stringify({

          accepted: true

        })

      }

    );




    const data = await response.json();



    return NextResponse.json(

      data,

      {
        status: response.status
      }

    );



  }

  catch(error) {


    console.log(error);



    return NextResponse.json(

      {
        error: "Server error",
        message: error.message
      },

      {
        status:500
      }

    );


  }

}