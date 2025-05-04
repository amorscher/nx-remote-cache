use axum::{
    body::{Body, Bytes},
    extract::Request,
};
use hyper::StatusCode;
mod test_utils;

use test_utils::{create_test_app, create_test_app_with_url, setup};
use tower::ServiceExt;

#[tokio::test]
async fn test_basic_get_from_cache() {
    //GIVEN and app with a Redis cache
    setup();
    let app = create_test_app().await;

    let test_key = "http-integration-key";
    let test_data = Bytes::from_static(b"hello via http");

    // Upload data via PUT
    let req = Request::builder()
        .method("PUT")
        .uri(format!("/v1/cache/{test_key}"))
        .header("Content-Length", test_data.len())
        .body(Body::from(test_data.clone()))
        .unwrap();

    let response = app.clone().oneshot(req).await.unwrap();
    assert_eq!(response.status(), StatusCode::ACCEPTED);

    //WHEN
    // Download data via GET
    let req = Request::builder()
        .method("GET")
        .uri(format!("/v1/cache/{test_key}"))
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();


    //THEN
    assert_eq!(response.status(), StatusCode::OK);

    let body_bytes = axum::body::to_bytes(response.into_body(), 1024)
        .await
        .unwrap();
    assert_eq!(body_bytes, test_data);
}


#[tokio::test]
async fn test_item_cannot_be_found_in_cache() {
    setup();
    //GIVEN and app with a Redis cache
    let app = create_test_app().await;

    let test_key = "not_available_key";

    //WHEN
    // Download data via GET
    let req = Request::builder()
        .method("GET")
        .uri(format!("/v1/cache/{test_key}"))
        .body(Body::empty())
        .unwrap();

    let response = app.oneshot(req).await.unwrap();


    //THEN
    assert_eq!(response.status(), StatusCode::NOT_FOUND);

}

// #[tokio::test]
// async fn test_wrong_url_reports_error() {
//     setup();
//     //GIVEN and app with a Redis cache
//     let app = create_test_app_with_url("redis://not-existing").await;

//     let test_key = "not_available_key";

//     //WHEN
//     // Download data via GET
//     let req = Request::builder()
//         .method("GET")
//         .uri(format!("/v1/cache/{test_key}"))
//         .body(Body::empty())
//         .unwrap();

//     let response = app.oneshot(req).await.unwrap();


//     //THEN
//     assert_eq!(response.status(), StatusCode::NOT_FOUND);

// }