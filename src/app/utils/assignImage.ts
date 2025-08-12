export async function assignImage(imageId: string, jwt: string) {
    await fetch(`${process.env.NEXT_PUBLIC_ORIGIN_API}/auth/merv/assign-image`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_id: imageId }),
    });
  }