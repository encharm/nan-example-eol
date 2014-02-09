{
  "targets": [
    {
      "target_name": "eol",
      "sources": [
        "src/addon.cc"
      ],
      "include_dirs"  : [
            "<!(node -e \"require('nan')\")"
      ],
      "cflags": ["-g"]
    }
  ]
}