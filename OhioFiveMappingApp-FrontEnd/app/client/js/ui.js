  $( "#toggleTimeline" ).click(function () {
  if ( $( "#visualization" ).is( ":hidden" ) ) {
    $( "#visualization" ).slideDown( "fast" );
    $("#toggleTimeline i").attr("class","fa fa-eye-slash")
  } else {
    $( "#visualization" ).hide();
    $("#toggleTimeline i").attr("class","fa fa-eye")
  }
});
